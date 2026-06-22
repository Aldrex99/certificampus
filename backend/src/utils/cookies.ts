import { Response } from "express";
import { env } from "../config/env";
import { AuthTokens } from "../services/auth.service";

export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

const baseOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax" as const,
};

export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions,
    path: "/",
    maxAge: env.accessCookieMaxAge,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions,
    path: env.refreshCookiePath, // limit refresh cookie to /auth endpoints
    maxAge: env.refreshCookieMaxAge,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions, path: "/" });
  res.clearCookie(REFRESH_COOKIE, {
    ...baseOptions,
    path: env.refreshCookiePath,
  });
}
