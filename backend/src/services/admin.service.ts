import { FilterQuery, Types } from "mongoose";
import {
  School,
  ISchool,
  User,
  Subscription,
  ISubscription,
  Plan,
  IPlan,
  Diploma,
  TemplateDiploma,
  ITemplateDiploma,
} from "../models";
import { ApiError } from "../utils/ApiError";
import { Pagination } from "../utils/context";
import { hashPassword } from "../utils/password";
import { generateOpaqueToken } from "../utils/jwt";
import { sendEmail } from "../utils/email";
import { activationEmail } from "../utils/emailTemplates";

export interface AdminDashboard {
  totals: {
    schools: number;
    activeSchools: number;
    diplomas: number;
    subscriptions: number;
  };
  schoolsByYear: { year: number; count: number }[];
  growthVsLastYear: number; // percentage
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const [schools, activeSchools, diplomas, subscriptions] = await Promise.all([
    School.countDocuments({}),
    School.countDocuments({ isActive: true }),
    Diploma.countDocuments({}),
    Subscription.countDocuments({}),
  ]);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];
  const schoolsByYear = await Promise.all(
    years.map(async (year) => {
      const count = await School.countDocuments({
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      });
      return { year, count };
    }),
  );

  const thisYear = schoolsByYear[2]?.count ?? 0;
  const lastYear = schoolsByYear[1]?.count ?? 0;
  const growthVsLastYear = lastYear
    ? Math.round(((thisYear - lastYear) / lastYear) * 100)
    : 0;

  return {
    totals: { schools, activeSchools, diplomas, subscriptions },
    schoolsByYear,
    growthVsLastYear,
  };
}

export async function listSchools(
  search: string | undefined,
  pagination: Pagination,
): Promise<{ items: ISchool[]; total: number; page: number; limit: number }> {
  const query: FilterQuery<ISchool> = {};
  if (search) query.label = new RegExp(search.trim(), "i");
  const [items, total] = await Promise.all([
    School.find(query)
      .populate("owner", "firstname lastname email isVerified")
      .populate("subscription", "name status")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    School.countDocuments(query),
  ]);
  return { items, total, page: pagination.page, limit: pagination.limit };
}

export interface CreateSchoolInput {
  label: string;
  address?: string;
  region?: string;
  ownerFirstname: string;
  ownerLastname: string;
  ownerEmail: string;
}

export async function createSchool(input: CreateSchoolInput): Promise<ISchool> {
  const existing = await User.findOne({ email: input.ownerEmail });
  if (existing)
    throw ApiError.conflict(
      "Un compte existe déjà avec cet e-mail responsable",
    );

  const activationToken = generateOpaqueToken();
  // Temporary random password; replaced on activation.
  const tempPassword = await hashPassword(generateOpaqueToken(12));

  const owner = await User.create({
    firstname: input.ownerFirstname,
    lastname: input.ownerLastname,
    email: input.ownerEmail,
    password: tempPassword,
    role: "school",
    isVerified: false,
    activationToken,
    activationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const school = await School.create({
    label: input.label,
    address: input.address,
    region: input.region,
    owner: owner._id,
  });
  owner.school = school._id as Types.ObjectId;
  await owner.save();

  const mail = activationEmail(activationToken, owner.email);
  await sendEmail({ to: owner.email, subject: mail.subject, html: mail.html });

  return school.populate("owner", "firstname lastname email isVerified");
}

export async function updateSchool(
  id: string,
  input: Partial<ISchool>,
): Promise<ISchool> {
  const school = await School.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!school) throw ApiError.notFound("École introuvable");
  return school;
}

export async function deleteSchools(ids: string[]): Promise<number> {
  const schools = await School.find({ _id: { $in: ids } });
  const ownerIds = schools.map((s) => s.owner);
  await User.deleteMany({ _id: { $in: ownerIds } });
  const result = await School.deleteMany({ _id: { $in: ids } });
  return result.deletedCount ?? 0;
}

export async function listSubscriptions(pagination: Pagination): Promise<{
  items: ISubscription[];
  total: number;
  page: number;
  limit: number;
}> {
  const [items, total] = await Promise.all([
    Subscription.find({})
      .populate("school", "label")
      .populate("plan", "name interval price certificateQuota")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Subscription.countDocuments({}),
  ]);
  return { items, total, page: pagination.page, limit: pagination.limit };
}

export async function createSubscription(
  input: Partial<ISubscription>,
): Promise<ISubscription> {
  const sub = await Subscription.create(input);
  if (sub.school) {
    await School.findByIdAndUpdate(sub.school, {
      $set: { subscription: sub._id },
    });
  }
  return sub;
}

export async function updateSubscription(
  id: string,
  input: Partial<ISubscription>,
): Promise<ISubscription> {
  const sub = await Subscription.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!sub) throw ApiError.notFound("Abonnement introuvable");
  return sub;
}

export async function deleteSubscriptions(ids: string[]): Promise<number> {
  const result = await Subscription.deleteMany({ _id: { $in: ids } });
  return result.deletedCount ?? 0;
}

/* ----------------------------- Plans ------------------------------ */

export async function listPlans(): Promise<IPlan[]> {
  return Plan.find({}).sort({ price: 1 });
}

export async function createPlan(input: Partial<IPlan>): Promise<IPlan> {
  return Plan.create(input);
}

export async function updatePlan(
  id: string,
  input: Partial<IPlan>,
): Promise<IPlan> {
  const plan = await Plan.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!plan) throw ApiError.notFound("Formule introuvable");
  return plan;
}

export async function deletePlans(ids: string[]): Promise<number> {
  const result = await Plan.deleteMany({ _id: { $in: ids } });
  return result.deletedCount ?? 0;
}

export async function listTemplates(): Promise<ITemplateDiploma[]> {
  return TemplateDiploma.find({}).sort({ isDefault: -1, createdAt: -1 });
}

export async function createTemplate(
  input: Partial<ITemplateDiploma>,
): Promise<ITemplateDiploma> {
  if (input.isDefault) {
    await TemplateDiploma.updateMany(
      { school: null },
      { $set: { isDefault: false } },
    );
  }
  return TemplateDiploma.create({ ...input, school: null });
}

export async function updateTemplate(
  id: string,
  input: Partial<ITemplateDiploma>,
): Promise<ITemplateDiploma> {
  if (input.isDefault) {
    await TemplateDiploma.updateMany(
      { school: null },
      { $set: { isDefault: false } },
    );
  }
  const tpl = await TemplateDiploma.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!tpl) throw ApiError.notFound("Template introuvable");
  return tpl;
}

export async function deleteTemplates(ids: string[]): Promise<number> {
  const result = await TemplateDiploma.deleteMany({ _id: { $in: ids } });
  return result.deletedCount ?? 0;
}
