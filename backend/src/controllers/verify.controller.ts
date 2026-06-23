import { Request, Response } from 'express';
import * as service from '../services/certification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/http';

/** Public endpoint — no auth — used by the QR code on each diploma. */
export const verify = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.verifyDiploma(req.params.token);
  ok(res, data);
});
