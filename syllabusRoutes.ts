import { Router } from 'express';
import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getPool } from './db.ts';

// Constants for caching and rate limiting
export const SYLLABUS_CACHE_TTL_MS = 60000; // 60 seconds
export const SYLLABUS_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const SYLLABUS_RATE_LIMIT_MAX_REQUESTS = 300; // 300 requests per 15 minutes per client IP

const ALLOWED_EXAM_CODES = new Set([
  'JAMB',
  'WAEC',
  'NECO',
  'POST_UTME',
  'UNIVERSITY',
  'CUSTOM',
]);

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setToCache<T>(key: string, data: T): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + SYLLABUS_CACHE_TTL_MS,
  });
}

export const syllabusRateLimiter = rateLimit({
  windowMs: SYLLABUS_RATE_LIMIT_WINDOW_MS,
  limit: SYLLABUS_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({ error: 'Too many requests' });
  },
});

export const syllabusRouter = Router();

// Apply rate limiter to all syllabus endpoints
syllabusRouter.use(syllabusRateLimiter);

// GET /api/syllabus - List all published exams with subject and topic counts
syllabusRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  const cacheKey = 'syllabus:list';
  const cached = getFromCache<unknown>(cacheKey);
  if (cached) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json(cached);
    return;
  }

  const pool = getPool();
  if (!pool) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  try {
    const result = await pool.query<{
      code: string;
      title: string;
      version: number;
      source_name: string | null;
      source_year: number | null;
      source_url: string | null;
      updated_at: Date;
      subject_count: string;
      topic_count: string;
    }>(
      `SELECT e.code, e.title, e.version, e.source_name, e.source_year, e.source_url, e.updated_at, (SELECT count(1) FROM syllabus_subjects s WHERE s.exam_code = e.code) AS subject_count, (SELECT count(1) FROM syllabus_topics t WHERE t.exam_code = e.code) AS topic_count FROM syllabus_exams e WHERE e.is_published = TRUE ORDER BY e.code`
    );

    const exams = result.rows.map((row) => ({
      code: row.code,
      title: row.title,
      version: row.version,
      sourceName: row.source_name,
      sourceYear: row.source_year,
      sourceUrl: row.source_url,
      updatedAt: row.updated_at,
      subjectCount: Number(row.subject_count),
      topicCount: Number(row.topic_count),
    }));

    const responseBody = { exams };
    setToCache(cacheKey, responseBody);

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json(responseBody);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    console.error('Database error code:', pgErr?.code || 'UNKNOWN');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/syllabus/:code - Full syllabus for a specific published exam
syllabusRouter.get('/:code', async (req: Request, res: Response): Promise<void> => {
  const code = req.params.code;

  // Validate :code parameter before checking cache or querying database
  if (!ALLOWED_EXAM_CODES.has(code)) {
    res.status(404).json({ error: 'Syllabus not found' });
    return;
  }

  const cacheKey = `syllabus:exam:${code}`;
  const cached = getFromCache<unknown>(cacheKey);
  if (cached) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json(cached);
    return;
  }

  const pool = getPool();
  if (!pool) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  try {
    const examRes = await pool.query<{
      code: string;
      title: string;
      version: number;
      source_name: string | null;
      source_year: number | null;
      source_url: string | null;
      updated_at: Date;
    }>(
      `SELECT code, title, version, source_name, source_year, source_url, updated_at FROM syllabus_exams WHERE code = $1 AND is_published = TRUE`,
      [code]
    );

    if (examRes.rows.length === 0) {
      res.status(404).json({ error: 'Syllabus not found' });
      return;
    }

    const examRow = examRes.rows[0];

    const subjectsRes = await pool.query<{
      slug: string;
      name: string;
      color: string;
      is_compulsory: boolean;
    }>(
      `SELECT slug, name, color, is_compulsory FROM syllabus_subjects WHERE exam_code = $1 ORDER BY sort_order, slug`,
      [code]
    );

    const topicsRes = await pool.query<{
      subject_slug: string;
      slug: string;
      name: string;
      section_name: string | null;
      default_difficulty: string;
    }>(
      `SELECT subject_slug, slug, name, section_name, default_difficulty FROM syllabus_topics WHERE exam_code = $1 ORDER BY subject_slug, sort_order, slug`,
      [code]
    );

    // Group topics by subject_slug
    const topicsBySubject = new Map<
      string,
      Array<{
        slug: string;
        name: string;
        section: string | null;
        difficulty: string;
      }>
    >();

    for (const t of topicsRes.rows) {
      let list = topicsBySubject.get(t.subject_slug);
      if (!list) {
        list = [];
        topicsBySubject.set(t.subject_slug, list);
      }
      list.push({
        slug: t.slug,
        name: t.name,
        section: t.section_name ?? null,
        difficulty: t.default_difficulty,
      });
    }

    const subjects = subjectsRes.rows.map((s) => ({
      slug: s.slug,
      name: s.name,
      color: s.color,
      isCompulsory: s.is_compulsory,
      topics: topicsBySubject.get(s.slug) || [],
    }));

    const responseBody = {
      code: examRow.code,
      title: examRow.title,
      version: examRow.version,
      sourceName: examRow.source_name,
      sourceYear: examRow.source_year,
      sourceUrl: examRow.source_url,
      updatedAt: examRow.updated_at,
      subjects,
    };

    setToCache(cacheKey, responseBody);

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json(responseBody);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    console.error('Database error code:', pgErr?.code || 'UNKNOWN');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
