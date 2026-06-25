import Stripe from "stripe";
import { env } from "./env";

/**
 * Whether real Stripe calls are enabled. When the secret key is absent the
 * billing layer falls back to a self-contained "mock" mode so the demo works
 * without any Stripe account or network access.
 */
export const stripeEnabled = Boolean(env.stripeSecretKey);

/**
 * Shared Stripe client. Only instantiated when a secret key is configured;
 * callers must guard with `stripeEnabled` before using it.
 */
export const stripe = stripeEnabled
  ? new Stripe(env.stripeSecretKey, { apiVersion: "2026-06-24.dahlia" })
  : (null as unknown as Stripe);
