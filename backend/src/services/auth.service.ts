import { Types } from "mongoose";
import { User, School, IUser } from "../models";
import { ApiError } from "../utils/ApiError";
import {
  hashPassword,
  comparePassword,
  isStrongPassword,
} from "../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateOpaqueToken,
} from "../utils/jwt";
import { AuthPayload } from "../types";
import { sendEmail } from "../utils/email";
import { activationEmail, resetPasswordEmail } from "../utils/emailTemplates";
import { env } from "../config/env";
import {
  ActivateInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "../validators/auth.schema";

const ACTIVATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export interface AuthUserView {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  school?: string;
  isVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: AuthUserView;
}

function toAuthUser(user: IUser): AuthUserView {
  return {
    id: String(user._id),
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    role: user.role,
    school: user.school ? String(user.school) : undefined,
    isVerified: Boolean(user.isVerified),
  };
}

function payloadFor(user: IUser): AuthPayload {
  return {
    sub: String(user._id),
    role: user.role,
    school: user.school ? String(user.school) : undefined,
  };
}

async function issueTokens(user: IUser): Promise<AuthTokens> {
  const payload = payloadFor(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  return { accessToken, refreshToken };
}

export async function register(
  input: RegisterInput,
): Promise<{ id: string; email: string }> {
  if (!isStrongPassword(input.password)) {
    throw ApiError.badRequest(
      "Le mot de passe doit contenir au moins 8 caractères, avec des lettres et des chiffres",
    );
  }

  const existing = await User.findOne({ email: input.email });
  if (existing)
    throw ApiError.conflict("Cette adresse e-mail est déjà utilisée");

  const passwordHash = await hashPassword(input.password);
  const activationToken = generateOpaqueToken();

  const user = await User.create({
    firstname: input.firstname,
    lastname: input.lastname,
    email: input.email,
    password: passwordHash,
    role: "school",
    isVerified: false,
    activationToken,
    activationExpires: new Date(Date.now() + ACTIVATION_TTL_MS),
  });

  const school = await School.create({
    label: input.schoolName,
    address: input.address,
    region: input.region,
    owner: user._id,
  });

  user.school = school._id as Types.ObjectId;
  await user.save();

  const mail = activationEmail(activationToken, user.email);
  await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });

  return { id: String(user._id), email: user.email };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select("+password");
  if (!user) throw ApiError.unauthorized("E-mail ou mot de passe incorrect");

  const valid = await comparePassword(input.password, user.password);
  if (!valid) throw ApiError.unauthorized("E-mail ou mot de passe incorrect");

  const tokens = await issueTokens(user);
  return { ...tokens, user: toAuthUser(user) };
}

export async function activateAccount(
  input: ActivateInput,
): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select(
    "+activationToken +activationExpires +password",
  );
  if (!user || !user.activationToken)
    throw ApiError.notFound("Compte introuvable");
  if (user.activationToken !== input.token)
    throw ApiError.forbidden("Token invalide");
  if (user.activationExpires && user.activationExpires.getTime() < Date.now()) {
    throw ApiError.forbidden("Token expiré");
  }

  if (input.password) {
    if (!isStrongPassword(input.password)) {
      throw ApiError.badRequest("Mot de passe trop faible");
    }
    user.password = await hashPassword(input.password);
  }

  user.isVerified = true;
  user.activationToken = null;
  user.activationExpires = null;
  await user.save();

  const tokens = await issueTokens(user);
  return { ...tokens, user: toAuthUser(user) };
}

export async function refreshTokens(refreshToken: string): Promise<AuthResult> {
  let payload: AuthPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Refresh token invalide ou expiré");
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user || !user.refreshTokenHash)
    throw ApiError.unauthorized("Session expirée");
  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    // Token reuse / mismatch — revoke the session defensively.
    user.refreshTokenHash = null;
    await user.save();
    throw ApiError.unauthorized("Refresh token révoqué");
  }

  const tokens = await issueTokens(user);
  return { ...tokens, user: toAuthUser(user) };
}

export async function logout(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $set: { refreshTokenHash: null } });
}

export async function forgotPassword(emailAddress: string): Promise<void> {
  const user = await User.findOne({ email: emailAddress });
  if (!user) return; // silent success — avoid user enumeration

  user.resetToken = generateOpaqueToken();
  user.resetExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  const mail = resetPasswordEmail(user.resetToken, user.email);
  await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  if (!isStrongPassword(input.password)) {
    throw ApiError.badRequest("Mot de passe trop faible");
  }
  const user = await User.findOne({ email: input.email }).select(
    "+resetToken +resetExpires +password",
  );
  if (!user || !user.resetToken || user.resetToken !== input.token) {
    throw ApiError.badRequest("Token de réinitialisation invalide");
  }
  if (user.resetExpires && user.resetExpires.getTime() < Date.now()) {
    throw ApiError.badRequest("Token de réinitialisation expiré");
  }

  user.password = await hashPassword(input.password);
  user.resetToken = null;
  user.resetExpires = null;
  await user.save();
}

export const authConfig = { clientUrl: env.clientUrl };
