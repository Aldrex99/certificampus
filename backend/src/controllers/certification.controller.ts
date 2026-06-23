import { Response } from "express";
import * as service from "../services/certification.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, created } from "../utils/http";
import { AuthRequest } from "../types";
import { requireSchoolId } from "../utils/context";

export const listCertifiable = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const schoolId = requireSchoolId(req);
    const items = await service.listCertifiableStudents(
      schoolId,
      req.query.training as string | undefined,
    );
    ok(res, items);
  },
);

export const preview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const data = await service.previewDiploma(
    schoolId,
    req.params.studentId,
    req.query.templateId as string | undefined,
  );
  ok(res, data);
});

export const generate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const schoolId = requireSchoolId(req);
    const result = await service.generateDiplomas(schoolId, req.body);
    created(res, result);
  },
);

export const publish = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const result = await service.publishDiplomas(schoolId, req.body);
  ok(res, result);
});
