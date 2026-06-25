import { Response } from "express";
import * as specialityService from "../services/speciality.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, created, noContent } from "../utils/http";
import { AuthRequest } from "../types";
import { requireSchoolId, getPagination } from "../utils/context";
import { ApiError } from "../utils/ApiError";

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const pagination = getPagination(req.query as Record<string, unknown>);
  const data = await specialityService.listSpecialities(
    schoolId,
    req.query.search as string | undefined,
    pagination,
  );
  ok(res, data);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const speciality = await specialityService.createSpeciality(
    schoolId,
    req.body,
  );
  created(res, speciality);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const speciality = await specialityService.updateSpeciality(
    schoolId,
    req.params.id,
    req.body,
  );
  ok(res, speciality);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const deleted = await specialityService.deleteSpecialities(schoolId, [
    req.params.id,
  ]);
  if (!deleted) throw ApiError.notFound("Spécialité introuvable");
  noContent(res);
});

export const bulkRemove = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const schoolId = requireSchoolId(req);
    const deleted = await specialityService.deleteSpecialities(
      schoolId,
      req.body.ids,
    );
    ok(res, { deleted });
  },
);
