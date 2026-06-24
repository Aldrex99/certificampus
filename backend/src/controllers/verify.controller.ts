import { Request, Response } from 'express';
import * as service from '../services/certification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/http';

/**
 * Public endpoint — no auth — consumed by the frontend verification page
 * that the diploma QR code points to.
 */
export const verify = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.verifyDiploma(req.params.token);
  ok(res, data);
});
