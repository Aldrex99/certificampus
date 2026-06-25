import { Application } from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import { User, School } from '../src/models';
import { hashPassword } from '../src/utils/password';
import { signAccessToken } from '../src/utils/jwt';

export const app: Application = createApp();

export interface SchoolContext {
  token: string;
  userId: string;
  schoolId: string;
  email: string;
}

/** Creates a verified school account directly in the DB and returns a token. */
export async function createSchoolContext(
  email = 'school@example.com'
): Promise<SchoolContext> {
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
