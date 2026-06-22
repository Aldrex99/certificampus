import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { ACCESS_COOKIE } from '../utils/cookies';

function extractToken(req: AuthRequest): string | undefined {
  // 1) httpOnly cookie (primary, set on login/refresh)
  const cookieToken = req.cookies?.[ACCESS_COOKIE];
  if (cookieToken) return cookieToken;
  // 2) Authorization header (API clients / tests)
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  // 3) token in JSON body (the cahier allows a token in the body)
  const body = req.body as { token?: string } | undefined;
  if (body?.token) return body.token;
  return undefined;
}

/** Verifies the access token and attaches the payload to `req.auth`. */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Token manquant');
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    throw ApiError.unauthorized('Token invalide ou expiré');
  }
}

/** Restricts a route to one or more roles. Use after `authenticate`. */
export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.auth) throw ApiError.unauthorized();
    if (!roles.includes(req.auth.role)) throw ApiError.forbidden('Accès refusé pour ce rôle');
    next();
  };
}
