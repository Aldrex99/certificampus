import { Response } from "express";
import * as dashboardService from "../services/dashboard.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/http";
import { AuthRequest } from "../types";
import { requireSchoolId } from "../utils/context";

export const getDashboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const schoolId = requireSchoolId(req);
    const data = await dashboardService.getSchoolDashboard(schoolId);
    ok(res, data);
  },
);
