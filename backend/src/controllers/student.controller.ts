import { Response } from "express";
import * as studentService from "../services/student.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, created, noContent } from "../utils/http";
import { AuthRequest } from "../types";
import { requireSchoolId, getPagination } from "../utils/context";
import { buildStudentTemplate } from "../utils/excel";
import { ApiError } from "../utils/ApiError";

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const pagination = getPagination(req.query as Record<string, unknown>);
  const data = await studentService.listStudents(
    schoolId,
    {
      search: req.query.search as string | undefined,
      status: req.query.status as "admis" | "ajourne" | undefined,
      training: req.query.training as string | undefined,
    },
    pagination,
  );
  ok(res, data);
});

export const getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const student = await studentService.getStudent(schoolId, req.params.id);
  ok(res, student);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const student = await studentService.createStudent(schoolId, req.body);
  created(res, student);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const student = await studentService.updateStudent(
    schoolId,
    req.params.id,
    req.body,
  );
  ok(res, student);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schoolId = requireSchoolId(req);
  const deleted = await studentService.deleteStudents(schoolId, [
    req.params.id,
  ]);
  if (!deleted) throw ApiError.notFound("Étudiant introuvable");
  noContent(res);
});

export const bulkRemove = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const schoolId = requireSchoolId(req);
    const deleted = await studentService.deleteStudents(schoolId, req.body.ids);
    ok(res, { deleted });
  },
);

export const importExcel = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const schoolId = requireSchoolId(req);
    if (!req.file)
      throw ApiError.badRequest('Fichier Excel manquant (champ "file")');
    const summary = await studentService.importStudentsFromBuffer(
      schoolId,
      req.file.buffer,
    );
    created(res, summary);
  },
);

export const downloadTemplate = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const buffer = buildStudentTemplate();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="students-template.xlsx"',
    );
    res.send(buffer);
  },
);
