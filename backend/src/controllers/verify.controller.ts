import { Request, Response } from 'express';
import * as service from '../services/certification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/http';
import { renderVerifyPage } from '../utils/verifyPage';

/**
 * Public endpoint — no auth — used by the QR code on each diploma.
 * Browsers (QR scan) get an HTML page; API clients get JSON.
 * Force JSON with `?format=json` or an `application/json` Accept header.
 */
export const verify = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.verifyDiploma(req.params.token);

  const wantsJson =
    req.query.format === 'json' || req.accepts(['html', 'json']) === 'json';

  if (wantsJson) {
    ok(res, data);
    return;
  }

  res.type('html').send(renderVerifyPage(data));
});
