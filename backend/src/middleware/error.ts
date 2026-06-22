import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound('Ressource introuvable'));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Erreur interne du serveur';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Données invalides';
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Identifiant invalide: ${err.value}`;
  } else if ((err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = 'Cette ressource existe déjà (valeur en doublon)';
    details = (err as { keyValue?: unknown }).keyValue;
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500 && !env.isTest) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
