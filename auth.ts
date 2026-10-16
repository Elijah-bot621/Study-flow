import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getPool } from './db.ts';

// Constants for owner registration and authentication limits
export const MAX_NEW_OWNERS_PER_DAY = 1000;
export const OWNER_REGISTRATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const OWNER_REGISTRATION_MAX_REQUESTS = 10; // 10 requests per hour per client IP

export const FAILED_AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const FAILED_AUTH_MAX_ATTEMPTS = 30; // 30 failed attempts per 15 minutes per client IP

const KEY_REGEX = /^[A-Za-z0-9_-]{43}$/;

/**
 * Generates a high-entropy 32-byte secret key encoded as base64url (43 characters).
 */
export function generateOwnerKey(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Computes the SHA-256 hash of the secret key as a 64-character lowercase hex string.
 */
export function hashOwnerKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex').toLowerCase();
}

/**
 * Rate limiter for owner registration: 10 requests per hour per client IP.
 */
export const ownerRegistrationLimiter = rateLimit({
  windowMs: OWNER_REGISTRATION_WINDOW_MS,
  limit: OWNER_REGISTRATION_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({ error: 'Too many requests' });
  },
});

/**
 * Rate limiter for failed authentication attempts: 30 failures per 15 minutes per client IP.
 * Successful requests (HTTP status < 400) are decremented and do not count against the limit.
 */
export const failedAuthLimiter = rateLimit({
  windowMs: FAILED_AUTH_WINDOW_MS,
  limit: FAILED_AUTH_MAX_ATTEMPTS,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({ error: 'Too many requests' });
  },
});

/**
 * Authentication middleware that verifies the owner secret key from Authorization: Bearer <key>.
 * Sets res.locals.ownerId on success.
 */
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  failedAuthLimiter(req, res, () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const rawKey = parts[1];
    if (!KEY_REGEX.test(rawKey)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const secretHash = hashOwnerKey(rawKey);

    pool
      .query<{ id: string }>('SELECT id FROM owners WHERE secret_hash = $1', [secretHash])
      .then((result) => {
        if (result.rows.length === 0) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        res.locals.ownerId = result.rows[0].id;
        next();
      })
      .catch((err: unknown) => {
        const pgErr = err as { code?: string };
        console.error('Database error code:', pgErr?.code || 'UNKNOWN');
        res.status(500).json({ error: 'Internal Server Error' });
      });
  });
}
