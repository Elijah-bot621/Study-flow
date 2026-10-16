import { Router } from 'express';
import type { Request, Response } from 'express';
import { getPool } from './db.ts';
import {
  MAX_NEW_OWNERS_PER_DAY,
  generateOwnerKey,
  hashOwnerKey,
  ownerRegistrationLimiter,
  requireOwner,
} from './auth.ts';

export const ownersRouter = Router();

// POST /api/owners - Creates an anonymous owner
ownersRouter.post(
  '/',
  ownerRegistrationLimiter,
  async (_req: Request, res: Response): Promise<void> => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    try {
      // Check global daily cap
      const capResult = await pool.query<{ count: string }>(
        "SELECT count(1) AS count FROM owners WHERE created_at > now() - interval '1 day'"
      );
      const newOwnersLastDay = parseInt(capResult.rows[0]?.count || '0', 10);
      if (newOwnersLastDay >= MAX_NEW_OWNERS_PER_DAY) {
        res.status(503).json({ error: 'Service busy. Try again later.' });
        return;
      }

      // Generate random secret key and SHA-256 hash
      const rawKey = generateOwnerKey();
      const secretHash = hashOwnerKey(rawKey);

      await pool.query('INSERT INTO owners (secret_hash) VALUES ($1)', [secretHash]);

      res.setHeader('Cache-Control', 'no-store');
      res.status(201).json({ ownerKey: rawKey });
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      console.error('Database error code:', pgErr?.code || 'UNKNOWN');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// GET /api/owners/me - Retrieves current owner information
ownersRouter.get(
  '/me',
  requireOwner,
  async (_req: Request, res: Response): Promise<void> => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const ownerId = res.locals.ownerId as string;

    try {
      const result = await pool.query<{ created_at: Date; last_active_at: Date }>(
        'SELECT created_at, last_active_at FROM owners WHERE id = $1',
        [ownerId]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const owner = result.rows[0];

      // Update last_active_at only when it is more than 1 hour old
      await pool.query(
        "UPDATE owners SET last_active_at = now() WHERE id = $1 AND last_active_at < now() - interval '1 hour'",
        [ownerId]
      );

      res.status(200).json({
        ok: true,
        createdAt: owner.created_at,
        lastActiveAt: owner.last_active_at,
      });
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      console.error('Database error code:', pgErr?.code || 'UNKNOWN');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// DELETE /api/owners/me - Deletes the authenticated owner
ownersRouter.delete(
  '/me',
  requireOwner,
  async (_req: Request, res: Response): Promise<void> => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const ownerId = res.locals.ownerId as string;

    try {
      await pool.query('DELETE FROM owners WHERE id = $1', [ownerId]);
      res.status(204).end();
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      console.error('Database error code:', pgErr?.code || 'UNKNOWN');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);
