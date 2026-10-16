import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { PoolClient } from 'pg';
import { getPool, closePool } from '../db.ts';

// Distinct 64-bit advisory lock key dedicated to StudyFlow syllabus imports
const SYLLABUS_ADVISORY_LOCK_ID = '958302159203126';

const ALLOWED_EXAM_CODES = new Set([
  'JAMB',
  'WAEC',
  'NECO',
  'POST_UTME',
  'UNIVERSITY',
  'CUSTOM',
]);

const ALLOWED_DIFFICULTIES = new Set(['weak', 'average', 'strong']);

const TOP_LEVEL_ALLOWED_KEYS = new Set([
  'code',
  'title',
  'sourceName',
  'sourceYear',
  'sourceUrl',
  'isPublished',
  'subjects',
]);

const SUBJECT_ALLOWED_KEYS = new Set([
  'slug',
  'name',
  'color',
  'isCompulsory',
  'topics',
]);

const TOPIC_ALLOWED_KEYS = new Set(['slug', 'name', 'section', 'difficulty']);

export interface TopicData {
  slug: string;
  name: string;
  section: string | null;
  difficulty: 'weak' | 'average' | 'strong';
}

export interface SubjectData {
  slug: string;
  name: string;
  color: string;
  isCompulsory: boolean;
  topics: TopicData[];
}

export interface ExamData {
  code: string;
  title: string;
  sourceName: string | null;
  sourceYear: number | null;
  sourceUrl: string | null;
  isPublished: boolean;
  subjects: SubjectData[];
}

function isValidSlug(slug: unknown, maxLen: number): boolean {
  if (typeof slug !== 'string' || slug.length < 1 || slug.length > maxLen) {
    return false;
  }
  // Allowed chars: lowercase a-z, 0-9, and hyphen, no hyphen at start or end
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return false;
  }
  return /^[a-z0-9-]+$/.test(slug);
}

export function validateSyllabusJson(data: unknown, filePath: string): { valid: boolean; errors: string[]; exam?: ExamData } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: [`${filePath}: Root must be an object`] };
  }

  const root = data as Record<string, unknown>;

  // Check unexpected top-level keys
  for (const k of Object.keys(root)) {
    if (!TOP_LEVEL_ALLOWED_KEYS.has(k)) {
      errors.push(`${filePath}: Unexpected top-level key '${k}'`);
    }
  }

  // code
  if (typeof root.code !== 'string' || !ALLOWED_EXAM_CODES.has(root.code)) {
    errors.push(
      `${filePath}: code must be one of ${Array.from(ALLOWED_EXAM_CODES).join(', ')}, got '${String(root.code)}'`
    );
  }

  // title
  if (typeof root.title !== 'string' || root.title.length < 1 || root.title.length > 200) {
    errors.push(`${filePath}: title must be a string between 1 and 200 characters`);
  }

  // sourceName
  if (root.sourceName !== null && (typeof root.sourceName !== 'string' || root.sourceName.length > 200)) {
    errors.push(`${filePath}: sourceName must be null or a string at most 200 characters`);
  }

  // sourceYear
  if (
    root.sourceYear !== null &&
    (typeof root.sourceYear !== 'number' ||
      !Number.isInteger(root.sourceYear) ||
      root.sourceYear < 1990 ||
      root.sourceYear > 2100)
  ) {
    errors.push(`${filePath}: sourceYear must be null or an integer from 1990 to 2100`);
  }

  // sourceUrl
  if (
    root.sourceUrl !== null &&
    (typeof root.sourceUrl !== 'string' ||
      root.sourceUrl.length > 500 ||
      (!root.sourceUrl.startsWith('http://') && !root.sourceUrl.startsWith('https://')))
  ) {
    errors.push(
      `${filePath}: sourceUrl must be null or start with http:// or https:// and be at most 500 characters`
    );
  }

  // isPublished
  if (typeof root.isPublished !== 'boolean') {
    errors.push(`${filePath}: isPublished must be a boolean`);
  }

  // subjects
  if (!Array.isArray(root.subjects)) {
    errors.push(`${filePath}: subjects must be an array`);
  } else if (root.subjects.length < 1 || root.subjects.length > 30) {
    errors.push(`${filePath}: subjects must contain between 1 and 30 items, got ${root.subjects.length}`);
  } else {
    const subjectSlugs = new Set<string>();
    const subjectNamesLower = new Set<string>();

    root.subjects.forEach((subjRaw: unknown, sIdx: number) => {
      const sPath = `subjects[${sIdx}]`;
      if (!subjRaw || typeof subjRaw !== 'object' || Array.isArray(subjRaw)) {
        errors.push(`${filePath}: ${sPath} must be an object`);
        return;
      }
      const subj = subjRaw as Record<string, unknown>;

      for (const sk of Object.keys(subj)) {
        if (!SUBJECT_ALLOWED_KEYS.has(sk)) {
          errors.push(`${filePath}: ${sPath} unexpected key '${sk}'`);
        }
      }

      // slug
      if (!isValidSlug(subj.slug, 100)) {
        errors.push(
          `${filePath}: ${sPath}.slug must be 1 to 100 characters containing only a-z, 0-9, and single hyphens without leading or trailing hyphens`
        );
      } else {
        const slugStr = subj.slug as string;
        if (subjectSlugs.has(slugStr)) {
          errors.push(`${filePath}: ${sPath}.slug duplicate subject slug '${slugStr}' in exam`);
        }
        subjectSlugs.add(slugStr);
      }

      // name
      if (typeof subj.name !== 'string' || subj.name.length < 1 || subj.name.length > 200) {
        errors.push(`${filePath}: ${sPath}.name must be a string between 1 and 200 characters`);
      } else {
        const nameLower = subj.name.toLowerCase();
        if (subjectNamesLower.has(nameLower)) {
          errors.push(`${filePath}: ${sPath}.name duplicate subject name '${subj.name}' (case-insensitive) in exam`);
        }
        subjectNamesLower.add(nameLower);
      }

      // color
      if (typeof subj.color !== 'string' || subj.color.length > 32) {
        errors.push(`${filePath}: ${sPath}.color must be a string at most 32 characters`);
      }

      // isCompulsory
      if (typeof subj.isCompulsory !== 'boolean') {
        errors.push(`${filePath}: ${sPath}.isCompulsory must be a boolean`);
      }

      // topics
      if (!Array.isArray(subj.topics)) {
        errors.push(`${filePath}: ${sPath}.topics must be an array`);
      } else if (subj.topics.length < 1 || subj.topics.length > 200) {
        errors.push(
          `${filePath}: ${sPath}.topics must contain between 1 and 200 items, got ${subj.topics.length}`
        );
      } else {
        const topicSlugs = new Set<string>();
        const topicNamesLower = new Set<string>();

        subj.topics.forEach((topRaw: unknown, tIdx: number) => {
          const tPath = `${sPath}.topics[${tIdx}]`;
          if (!topRaw || typeof topRaw !== 'object' || Array.isArray(topRaw)) {
            errors.push(`${filePath}: ${tPath} must be an object`);
            return;
          }
          const top = topRaw as Record<string, unknown>;

          for (const tk of Object.keys(top)) {
            if (!TOPIC_ALLOWED_KEYS.has(tk)) {
              errors.push(`${filePath}: ${tPath} unexpected key '${tk}'`);
            }
          }

          // slug
          if (!isValidSlug(top.slug, 120)) {
            errors.push(
              `${filePath}: ${tPath}.slug must be 1 to 120 characters containing only a-z, 0-9, and single hyphens without leading or trailing hyphens`
            );
          } else {
            const tSlugStr = top.slug as string;
            if (topicSlugs.has(tSlugStr)) {
              errors.push(
                `${filePath}: ${tPath}.slug duplicate topic slug '${tSlugStr}' in subject '${String(subj.name)}'`
              );
            }
            topicSlugs.add(tSlugStr);
          }

          // name
          if (typeof top.name !== 'string' || top.name.length < 1 || top.name.length > 200) {
            errors.push(`${filePath}: ${tPath}.name must be a string between 1 and 200 characters`);
          } else {
            const tNameLower = top.name.toLowerCase();
            if (topicNamesLower.has(tNameLower)) {
              errors.push(
                `${filePath}: ${tPath}.name duplicate topic name '${top.name}' (case-insensitive) in subject '${String(subj.name)}'`
              );
            }
            topicNamesLower.add(tNameLower);
          }

          // section
          if (top.section !== null && (typeof top.section !== 'string' || top.section.length < 1 || top.section.length > 200)) {
            errors.push(`${filePath}: ${tPath}.section must be null or a string between 1 and 200 characters`);
          }

          // difficulty
          if (typeof top.difficulty !== 'string' || !ALLOWED_DIFFICULTIES.has(top.difficulty)) {
            errors.push(
              `${filePath}: ${tPath}.difficulty must be one of 'weak', 'average', 'strong', got '${String(top.difficulty)}'`
            );
          }
        });
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    exam: data as ExamData,
  };
}

export function computeCanonicalContentHash(exam: ExamData): string {
  const canonicalObj = {
    title: exam.title,
    sourceName: exam.sourceName,
    sourceYear: exam.sourceYear,
    sourceUrl: exam.sourceUrl,
    isPublished: exam.isPublished,
    subjects: exam.subjects.map((s) => ({
      slug: s.slug,
      name: s.name,
      color: s.color,
      isCompulsory: s.isCompulsory,
      topics: s.topics.map((t) => ({
        slug: t.slug,
        name: t.name,
        section: t.section,
        difficulty: t.difficulty,
      })),
    })),
  };
  const canonicalJson = JSON.stringify(canonicalObj);
  return crypto.createHash('sha256').update(canonicalJson, 'utf-8').digest('hex').toLowerCase();
}

async function importExam(client: PoolClient, exam: ExamData, contentHash: string): Promise<string> {
  const totalSubjects = exam.subjects.length;
  const totalTopics = exam.subjects.reduce((acc, s) => acc + s.topics.length, 0);

  // Check if exam already exists
  const existingRes = await client.query<{ version: number; content_hash: string }>(
    'SELECT version, content_hash FROM syllabus_exams WHERE code = $1',
    [exam.code]
  );

  if (existingRes.rows.length === 0) {
    // Insert new exam with version 1
    await client.query(
      `INSERT INTO syllabus_exams (
        code, title, version, content_hash, source_name, source_year, source_url, is_published, created_at, updated_at
      ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        exam.code,
        exam.title,
        contentHash,
        exam.sourceName,
        exam.sourceYear,
        exam.sourceUrl,
        exam.isPublished,
      ]
    );

    // Insert subjects and topics
    for (let sIdx = 0; sIdx < exam.subjects.length; sIdx++) {
      const subj = exam.subjects[sIdx];
      const sSortOrder = sIdx + 1;

      await client.query(
        `INSERT INTO syllabus_subjects (
          exam_code, slug, name, color, sort_order, is_compulsory, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [exam.code, subj.slug, subj.name, subj.color, sSortOrder, subj.isCompulsory]
      );

      for (let tIdx = 0; tIdx < subj.topics.length; tIdx++) {
        const top = subj.topics[tIdx];
        const tSortOrder = tIdx + 1;

        await client.query(
          `INSERT INTO syllabus_topics (
            exam_code, subject_slug, slug, name, section_name, default_difficulty, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            exam.code,
            subj.slug,
            top.slug,
            top.name,
            top.section,
            top.difficulty,
            tSortOrder,
          ]
        );
      }
    }

    return `${exam.code}: created (version 1, ${totalSubjects} subjects, ${totalTopics} topics)`;
  }

  const existing = existingRes.rows[0];
  if (existing.content_hash === contentHash) {
    return `${exam.code}: unchanged (version ${existing.version})`;
  }

  // Content hash differs: update version, replace subjects and topics
  const newVersion = existing.version + 1;

  // Deleting subjects cascades to topics via ON DELETE CASCADE
  await client.query('DELETE FROM syllabus_subjects WHERE exam_code = $1', [exam.code]);

  await client.query(
    `UPDATE syllabus_exams
    SET version = $1,
        content_hash = $2,
        title = $3,
        source_name = $4,
        source_year = $5,
        source_url = $6,
        is_published = $7,
        updated_at = NOW()
    WHERE code = $8`,
    [
      newVersion,
      contentHash,
      exam.title,
      exam.sourceName,
      exam.sourceYear,
      exam.sourceUrl,
      exam.isPublished,
      exam.code,
    ]
  );

  // Insert subjects and topics again
  for (let sIdx = 0; sIdx < exam.subjects.length; sIdx++) {
    const subj = exam.subjects[sIdx];
    const sSortOrder = sIdx + 1;

    await client.query(
      `INSERT INTO syllabus_subjects (
        exam_code, slug, name, color, sort_order, is_compulsory, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [exam.code, subj.slug, subj.name, subj.color, sSortOrder, subj.isCompulsory]
    );

    for (let tIdx = 0; tIdx < subj.topics.length; tIdx++) {
      const top = subj.topics[tIdx];
      const tSortOrder = tIdx + 1;

      await client.query(
        `INSERT INTO syllabus_topics (
          exam_code, subject_slug, slug, name, section_name, default_difficulty, sort_order, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          exam.code,
          subj.slug,
          top.slug,
          top.name,
          top.section,
          top.difficulty,
          tSortOrder,
        ]
      );
    }
  }

  return `${exam.code}: updated (version ${newVersion}, ${totalSubjects} subjects, ${totalTopics} topics)`;
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const fileArgs = args.filter((arg) => arg !== '--dry-run');

  let filePaths: string[] = [];

  if (fileArgs.length > 0) {
    filePaths = fileArgs.map((f) => path.resolve(f));
  } else {
    const seedDir = path.resolve('db/seed/syllabus');
    if (!fs.existsSync(seedDir)) {
      console.error(`Syllabus directory not found: ${seedDir}`);
      process.exit(1);
    }
    filePaths = fs
      .readdirSync(seedDir)
      .filter((file) => file.endsWith('.json'))
      .sort()
      .map((file) => path.join(seedDir, file));
  }

  if (filePaths.length === 0) {
    console.error('No syllabus JSON files found to import.');
    process.exit(1);
  }

  // 1. Read and strictly validate all files first
  const validatedExams: { filePath: string; exam: ExamData; contentHash: string }[] = [];
  const allErrors: string[] = [];

  for (const fPath of filePaths) {
    if (!fs.existsSync(fPath)) {
      allErrors.push(`File not found: ${fPath}`);
      continue;
    }

    let parsed: unknown;
    try {
      const content = fs.readFileSync(fPath, 'utf-8');
      parsed = JSON.parse(content);
    } catch (err: unknown) {
      allErrors.push(`Failed to parse JSON in ${fPath}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    const valResult = validateSyllabusJson(parsed, fPath);
    if (!valResult.valid || !valResult.exam) {
      allErrors.push(...valResult.errors);
    } else {
      const hash = computeCanonicalContentHash(valResult.exam);
      validatedExams.push({
        filePath: fPath,
        exam: valResult.exam,
        contentHash: hash,
      });
    }
  }

  if (allErrors.length > 0) {
    console.error('Syllabus validation failed:');
    allErrors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  // 2. Dry run handling: do NOT connect to database
  if (isDryRun) {
    for (const item of validatedExams) {
      const totalSubjects = item.exam.subjects.length;
      const totalTopics = item.exam.subjects.reduce((acc, s) => acc + s.topics.length, 0);
      console.log(
        `${item.exam.code}: would import (${totalSubjects} subjects, ${totalTopics} topics, content hash: ${item.contentHash})`
      );
    }
    process.exit(0);
  }

  // 3. Connect to database and process each file in a transaction
  const pool = getPool();
  if (!pool) {
    console.error('Database connection pool is not configured.');
    process.exit(1);
  }

  try {
    for (const item of validatedExams) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [SYLLABUS_ADVISORY_LOCK_ID]);

        const message = await importExam(client, item.exam, item.contentHash);

        await client.query('COMMIT');
        console.log(message);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error importing ${item.exam.code}:`, err instanceof Error ? err.message : err);
        throw err;
      } finally {
        client.release();
      }
    }
  } catch {
    await closePool();
    process.exit(1);
  }

  await closePool();
  process.exit(0);
}

// Only execute when run directly from the command line
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch((err) => {
    console.error('Fatal import error:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
