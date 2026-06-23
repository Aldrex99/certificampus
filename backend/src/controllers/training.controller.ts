import { Response } from "express";
import * as trainingService from "../services/training.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, created, noContent } from "../utils/http";
import { AuthRequest } from "../types";
import { requireSchoolId, getPagination } from "../utils/context";
import { ApiError } from "../utils/ApiError";

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const pagination = getPagination(req.query as Record<string, unknown>);
  const data = await trainingService.listTrainings(
    schoolId,
    req.query.search as string | undefined,
    pagination,
  );
  ok(res, data);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const training = await trainingService.createTraining(schoolId, req.body);
  created(res, training);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const training = await trainingService.updateTraining(
    schoolId,
    req.params.id,
    req.body,
  );
  ok(res, training);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const deleted = await trainingService.deleteTrainings(schoolId, [
    req.params.id,
  ]);
  if (!deleted) throw ApiError.notFound("Formation introuvable");
  noContent(res);
});

export const bulkRemove = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const schoolId = requireSchoolId(req);
    const deleted = await trainingService.deleteTrainings(
      schoolId,
      req.body.ids,
    );
    ok(res, { deleted });
  },
);
