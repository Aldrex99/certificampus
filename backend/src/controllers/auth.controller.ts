import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, created, noContent } from "../utils/http";
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_COOKIE,
} from "../utils/cookies";
import { ApiError } from "../utils/ApiError";
import { verifyRefreshToken } from "../utils/jwt";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  created(res, {
    message: "Compte créé. Vérifiez votre e-mail pour activer le compte.",
    ...result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  setAuthCookies(res, { accessToken, refreshToken });
  ok(res, { user });
});

export const activate = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, user } = await authService.activateAccount(
    req.body,
  );
  setAuthCookies(res, { accessToken, refreshToken });
  ok(res, { user });
});

/** Rotates tokens from the refresh cookie. */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("Refresh token manquant");
  const { accessToken, refreshToken, user } =
    await authService.refreshTokens(token);
  setAuthCookies(res, { accessToken, refreshToken });
  ok(res, { user });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await authService.logout(payload.sub);
    } catch {
      // Invalid/expired refresh token — still clear cookies below.
    }
  }
  clearAuthCookies(res);
  noContent(res);
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    noContent(res);
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    await authService.resetPassword(req.body);
    ok(res, { message: "Mot de passe réinitialisé avec succès" });
  },
);
