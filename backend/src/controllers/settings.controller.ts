import { Response } from "express";
import * as service from "../services/settings.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/http";
import { AuthRequest } from "../types";
import { ApiError } from "../utils/ApiError";

function userId(req: AuthRequest): string {
  if (!req.auth) throw ApiError.unauthorized();
  return req.auth.sub;
}

export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    ok(res, await service.getProfile(userId(req)));
  },
);

export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    ok(res, await service.updateProfile(userId(req), req.body));
  },
);

export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await service.changePassword(userId(req), req.body);
    ok(res, { message: "Mot de passe modifié avec succès" });
  },
);
