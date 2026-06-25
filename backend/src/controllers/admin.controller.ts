import { Response } from "express";
import * as service from "../services/admin.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, created, noContent } from "../utils/http";
import { AuthRequest } from "../types";
import { getPagination } from "../utils/context";
import { ApiError } from "../utils/ApiError";

export const dashboard = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    ok(res, await service.getAdminDashboard());
  },
);

export const listSchools = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const data = await service.listSchools(
      req.query.search as string | undefined,
      getPagination(req.query as Record<string, unknown>),
    );
    ok(res, data);
  },
);

export const createSchool = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    created(res, await service.createSchool(req.body));
  },
);

export const updateSchool = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    ok(res, await service.updateSchool(req.params.id, req.body));
  },
);

export const deleteSchool = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const deleted = await service.deleteSchools([req.params.id]);
    if (!deleted) throw ApiError.notFound("École introuvable");
    noContent(res);
  },
);

export const bulkDeleteSchools = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    ok(res, { deleted: await service.deleteSchools(req.body.ids) });
  },
);

export const listSubscriptions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    ok(
      res,
      await service.listSubscriptions(
        getPagination(req.query as Record<string, unknown>),
      ),
    );
  },
);

export const createSubscription = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    created(res, await service.createSubscription(req.body));
  },
);

export const updateSubscription = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    ok(res, await service.updateSubscription(req.params.id, req.body));
  },
);

export const deleteSubscription = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const deleted = await service.deleteSubscriptions([req.params.id]);
    if (!deleted) throw ApiError.notFound("Abonnement introuvable");
    noContent(res);
  },
);

export const bulkDeleteSubscriptions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    ok(res, { deleted: await service.deleteSubscriptions(req.body.ids) });
  },
);

export const listPlans = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    ok(res, await service.listPlans());
  },
);

export const createPlan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    created(res, await service.createPlan(req.body));
  },
);

export const updatePlan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    ok(res, await service.updatePlan(req.params.id, req.body));
  },
);

export const deletePlan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const deleted = await service.deletePlans([req.params.id]);
    if (!deleted) throw ApiError.notFound("Formule introuvable");
    noContent(res);
  },
);

export const bulkDeletePlans = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    ok(res, { deleted: await service.deletePlans(req.body.ids) });
  },
);

export const listTemplates = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    ok(res, await service.listTemplates());
  },
);

export const createTemplate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    created(res, await service.createTemplate(req.body));
  },
);

export const updateTemplate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    ok(res, await service.updateTemplate(req.params.id, req.body));
  },
);

export const deleteTemplate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const deleted = await service.deleteTemplates([req.params.id]);
    if (!deleted) throw ApiError.notFound("Template introuvable");
    noContent(res);
  },
);
