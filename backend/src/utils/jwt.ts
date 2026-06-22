import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { AuthPayload } from "../types";

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl,
  } as SignOptions);
}

export function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.refreshTokenTtl,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as AuthPayload;
}

/** SHA-256 hash of a refresh token, stored in DB to allow rotation/revocation. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function generateQrToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
