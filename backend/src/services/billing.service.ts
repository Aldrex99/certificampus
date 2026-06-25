import type Stripe from "stripe";
import { Types } from "mongoose";
import { env } from "../config/env";
import { stripe, stripeEnabled } from "../config/stripe";
import { Plan, IPlan, Subscription, ISubscription, School } from "../models";
import { ApiError } from "../utils/ApiError";

/** Computes the end of a billing period starting at `start`. */
function periodEnd(start: Date, interval: IPlan["interval"]): Date {
  const end = new Date(start);
  if (interval === "year") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

/** Active plans offered to schools. */
export async function listPlans(): Promise<IPlan[]> {
  return Plan.find({ isActive: true }).sort({ price: 1 });
}

export interface CurrentSubscription {
  subscription: ISubscription | null;
  plan: IPlan | null;
  quota: number;
  used: number;
  remaining: number;
  periodEnd: Date | null;
}

/** Returns the school's active subscription with its usage, resetting the
 *  period counter first if the current period has elapsed. */
export async function getCurrentSubscription(
  schoolId: string,
): Promise<CurrentSubscription> {
  const subscription = await Subscription.findOne({
    school: schoolId,
    status: "active",
  });

  if (!subscription || !subscription.plan) {
    return {
      subscription: subscription ?? null,
      plan: null,
      quota: 0,
      used: 0,
      remaining: 0,
      periodEnd: null,
    };
  }

  await rollPeriodIfNeeded(subscription);
  const plan = await Plan.findById(subscription.plan);
  const quota = plan?.certificateQuota ?? 0;
  const used = subscription.usedThisPeriod;

  return {
    subscription,
    plan: plan ?? null,
    quota,
    used,
    remaining: Math.max(0, quota - used),
    periodEnd: subscription.currentPeriodEnd ?? null,
  };
}

/** Resets the usage counter and advances the period when it has expired. */
async function rollPeriodIfNeeded(sub: ISubscription): Promise<void> {
  const now = new Date();
  if (sub.currentPeriodEnd && sub.currentPeriodEnd > now) return;

  const plan = await Plan.findById(sub.plan);
  if (!plan) return;

  const start = now;
  sub.currentPeriodStart = start;
  sub.currentPeriodEnd = periodEnd(start, plan.interval);
  sub.usedThisPeriod = 0;
  await sub.save();
}

/**
 * Reserves `count` certificates against the school's quota. Throws (402) when
 * the school has no active subscription or the period quota would be exceeded.
 * Increments the usage counter on success.
 */
export async function consumeCertificateQuota(
  schoolId: string,
  count: number,
): Promise<void> {
  if (count <= 0) return;

  const { subscription, plan, remaining } =
    await getCurrentSubscription(schoolId);

  if (!subscription || !plan) {
    throw new ApiError(
      402,
      "Aucun abonnement actif. Souscrivez à une formule pour générer des certificats.",
    );
  }

  if (count > remaining) {
    throw new ApiError(
      402,
      `Quota de certificats atteint pour cette période (${plan.certificateQuota} max). ` +
        `Il reste ${remaining} certificat(s) disponible(s).`,
    );
  }

  subscription.usedThisPeriod += count;
  await subscription.save();
}

export interface CheckoutResult {
  url: string;
  /** True when no real Stripe call was made (mock mode). */
  mocked: boolean;
}

/**
 * Starts a Stripe Checkout session (subscription mode) for the given plan.
 * In mock mode (no Stripe key), the subscription is activated immediately and
 * a local success URL is returned so the demo flow still works end to end.
 */
export async function createCheckoutSession(
  schoolId: string,
  planId: string,
): Promise<CheckoutResult> {
  const school = await School.findById(schoolId);
  if (!school) throw ApiError.notFound("Établissement introuvable");

  const plan = await Plan.findOne({ _id: planId, isActive: true });
  if (!plan) throw ApiError.notFound("Formule introuvable ou indisponible");

  if (!stripeEnabled) {
    await activateSubscription(schoolId, plan, { mocked: true });
    return {
      url: `${env.clientUrl}/school/subscription?checkout=success&mock=1`,
      mocked: true,
    };
  }

  const sub = await Subscription.findOne({ school: schoolId });
  let customerId = sub?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: school.label,
      metadata: { schoolId },
    });
    customerId = customer.id;
  }

  const lineItem = plan.stripePriceId
    ? { price: plan.stripePriceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "eur",
          recurring: { interval: plan.interval },
          unit_amount: Math.round(plan.price * 100),
          product_data: {
            name: plan.name,
            description: `${plan.certificateQuota} certificats / ${plan.interval === "year" ? "an" : "mois"}`,
          },
        },
      };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [lineItem as Stripe.Checkout.SessionCreateParams.LineItem],
    success_url: `${env.clientUrl}/school/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/school/subscription?checkout=cancel`,
    metadata: { schoolId, planId: String(plan._id) },
    subscription_data: { metadata: { schoolId, planId: String(plan._id) } },
  });

  // Persist the pending intent so the webhook can reconcile.
  await Subscription.findOneAndUpdate(
    { school: schoolId },
    {
      $set: {
        school: new Types.ObjectId(schoolId),
        plan: plan._id,
        status: "pending",
        stripeCustomerId: customerId,
        stripeSessionId: session.id,
      },
    },
    { upsert: true },
  );

  if (!session.url) throw ApiError.internal("Session Stripe sans URL");
  return { url: session.url, mocked: false };
}

/** Creates/activates the school subscription and links it to the school. */
async function activateSubscription(
  schoolId: string,
  plan: IPlan,
  extra: {
    mocked?: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripeSessionId?: string;
  } = {},
): Promise<ISubscription> {
  const start = new Date();
  const sub = await Subscription.findOneAndUpdate(
    { school: schoolId },
    {
      $set: {
        school: new Types.ObjectId(schoolId),
        plan: plan._id,
        status: "active",
        name: plan.name,
        price: plan.price,
        type: plan.interval === "year" ? "yearly" : "monthly",
        usedThisPeriod: 0,
        currentPeriodStart: start,
        currentPeriodEnd: periodEnd(start, plan.interval),
        startDate: start,
        endDate: periodEnd(start, plan.interval),
        ...(extra.stripeCustomerId && {
          stripeCustomerId: extra.stripeCustomerId,
        }),
        ...(extra.stripeSubscriptionId && {
          stripeSubscriptionId: extra.stripeSubscriptionId,
        }),
        ...(extra.stripeSessionId && {
          stripeSessionId: extra.stripeSessionId,
        }),
      },
    },
    { new: true, upsert: true },
  );

  await School.findByIdAndUpdate(schoolId, {
    $set: { subscription: sub._id },
  });

  return sub;
}

/** Verifies and handles an incoming Stripe webhook payload. */
export async function handleWebhook(
  rawBody: Buffer,
  signature: string | undefined,
): Promise<void> {
  if (!stripeEnabled) return;

  let event: Stripe.Event;
  if (env.stripeWebhookSecret && signature) {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.stripeWebhookSecret,
    );
  } else {
    // No signing secret configured (local dev): trust the payload as-is.
    event = JSON.parse(rawBody.toString()) as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const schoolId = session.metadata?.schoolId;
    const planId = session.metadata?.planId;
    if (!schoolId || !planId) return;

    const plan = await Plan.findById(planId);
    if (!plan) return;

    await activateSubscription(schoolId, plan, {
      stripeCustomerId:
        typeof session.customer === "string"
          ? session.customer
          : undefined,
      stripeSubscriptionId:
        typeof session.subscription === "string"
          ? session.subscription
          : undefined,
      stripeSessionId: session.id,
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: sub.id },
      { $set: { status: "cancelled" } },
    );
  }
}
