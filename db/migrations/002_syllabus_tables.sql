-- Study Flow migration 002: shared exam syllabus tables.
-- Reference data that is the same for every student, so these tables have no owner_id.
-- The public API will only read them. Content is loaded by an import script, never by public requests.
-- Additive only. Safe to re-run: uses IF NOT EXISTS.
-- Never edit this file after it has been applied. Add a new numbered file instead.

CREATE TABLE IF NOT EXISTS syllabus_exams (
  code TEXT PRIMARY KEY CHECK (code IN ('JAMB', 'WAEC', 'NECO', 'POST_UTME', 'UNIVERSITY', 'CUSTOM')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  content_hash TEXT CHECK (content_hash IS NULL OR (char_length(content_hash) = 64 AND translate(content_hash, '0123456789abcdef', '') = '')),
  source_name TEXT CHECK (source_name IS NULL OR char_length(source_name) <= 200),
  source_year INTEGER CHECK (source_year IS NULL OR (source_year >= 1990 AND source_year <= 2100)),
  source_url TEXT CHECK (source_url IS NULL OR (char_length(source_url) <= 500 AND (source_url LIKE 'http://%' OR source_url LIKE 'https://%'))),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS syllabus_subjects (
  exam_code TEXT NOT NULL REFERENCES syllabus_exams (code) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (
    char_length(slug) BETWEEN 1 AND 100
    AND translate(slug, 'abcdefghijklmnopqrstuvwxyz0123456789-', '') = ''
    AND slug NOT LIKE '-%' AND slug NOT LIKE '%-'
  ),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  color TEXT NOT NULL DEFAULT '#3B82F6' CHECK (char_length(color) <= 32),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_compulsory BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (exam_code, slug)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_syllabus_subjects_name ON syllabus_subjects (exam_code, lower(name));

CREATE TABLE IF NOT EXISTS syllabus_topics (
  exam_code TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  slug TEXT NOT NULL CHECK (
    char_length(slug) BETWEEN 1 AND 120
    AND translate(slug, 'abcdefghijklmnopqrstuvwxyz0123456789-', '') = ''
    AND slug NOT LIKE '-%' AND slug NOT LIKE '%-'
  ),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  section_name TEXT CHECK (section_name IS NULL OR char_length(section_name) BETWEEN 1 AND 200),
  default_difficulty TEXT NOT NULL DEFAULT 'average' CHECK (default_difficulty IN ('weak', 'average', 'strong')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (exam_code, subject_slug, slug),
  FOREIGN KEY (exam_code, subject_slug) REFERENCES syllabus_subjects (exam_code, slug) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_syllabus_topics_name ON syllabus_topics (exam_code, subject_slug, lower(name));
