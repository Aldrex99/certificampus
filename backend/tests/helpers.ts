import { Application } from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import { User, School, Plan, Subscription } from '../src/models';
import { hashPassword } from '../src/utils/password';
import { signAccessToken } from '../src/utils/jwt';

export const app: Application = createApp();

export interface SchoolContext {
  token: string;
  userId: string;
  schoolId: string;
  email: string;
}

interface SchoolContextOptions {
  /** Certificate quota of the seeded active subscription. 0 = no subscription. */
  quota?: number;
}

/** Creates a verified school account directly in the DB and returns a token.
 *  By default the school gets an active subscription with a generous quota so
 *  certificate generation is not blocked. Pass `{ quota: 0 }` to skip it. */
export async function createSchoolContext(
  email = 'school@example.com',
  options: SchoolContextOptions = {}
): Promise<SchoolContext> {
  const { quota = 100 } = options;
  const user = await User.create({
    firstname: 'Marie',
    lastname: 'Curie',
    email,
    password: await hashPassword('Password1'),
    role: 'school',
    isVerified: true,
  });
  const school = await School.create({ label: 'École Test', owner: user._id });
  user.school = school._id as never;
  await user.save();

  if (quota > 0) {
    const plan = await Plan.create({
      name: 'Test',
      price: 10,
      interval: 'month',
      certificateQuota: quota,
    });
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const sub = await Subscription.create({
      plan: plan._id,
      school: school._id,
      status: 'active',
      usedThisPeriod: 0,
      currentPeriodStart: start,
      currentPeriodEnd: end,
    });
    school.subscription = sub._id as never;
    await school.save();
  }

  const token = signAccessToken({
    sub: String(user._id),
    role: 'school',
    school: String(school._id),
  });
  return { token, userId: String(user._id), schoolId: String(school._id), email };
}

export async function createAdminContext(): Promise<{ token: string; userId: string }> {
  const user = await User.create({
    firstname: 'Admin',
    lastname: 'Root',
    email: 'admin@example.com',
    password: await hashPassword('Password1'),
    role: 'admin',
    isVerified: true,
  });
  const token = signAccessToken({ sub: String(user._id), role: 'admin' });
  return { token, userId: String(user._id) };
}

export const api = () => request(app);
export const auth = (token: string) => `Bearer ${token}`;
