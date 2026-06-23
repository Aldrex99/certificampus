import { AuthRequest } from "../types";
import { ApiError } from "./ApiError";

/** Returns the school id bound to the authenticated school user, or throws. */
export function requireSchoolId(req: AuthRequest): string {
  const schoolId = req.auth?.school;
  if (!schoolId)
    throw ApiError.forbidden("Aucun établissement associé à ce compte");
  return schoolId;
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(query: Record<string, unknown>): Pagination {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}
