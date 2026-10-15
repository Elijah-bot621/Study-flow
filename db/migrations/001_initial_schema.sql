-- Study Flow migration 001: initial schema.
-- Anonymous owners plus owner-scoped study data.
-- Safe to re-run: uses IF NOT EXISTS. Contains no destructive statements.
-- Never edit this file after it has been applied. Add 002_*.sql instead.
-- The migration runner (db/migrate.ts) creates and manages schema_migrations itself.
--
-- Keys: subjects and topics are scoped by owner AND exam, so the same preset
-- subject or topic id can safely appear in two different exams of one owner.
-- Child rows reference their parents with composite foreign keys that include
-- owner_id, so a row can never point at another owner's data.

CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_hash TEXT NOT NULL UNIQUE CHECK (char_length(secret_hash) BETWEEN 32 AND 256),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exams (
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  id TEXT NOT NULL CHECK (char_length(id) BETWEEN 1 AND 255),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  exam_type TEXT NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC', 'NECO', 'POST_UTME', 'UNIVERSITY', 'CUSTOM')),
  exam_date DATE NOT NULL,
  daily_study_hours NUMERIC(4, 2) NOT NULL CHECK (daily_study_hours >= 0.5 AND daily_study_hours <= 12),
  preferred_periods TEXT[] NOT NULL DEFAULT '{}'
    CHECK (preferred_periods <@ ARRAY['early_morning', 'morning', 'afternoon', 'evening', 'night']::TEXT[]),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (owner_id, id)
);

-- At most one active exam per owner.
CREATE UNIQUE INDEX IF NOT EXISTS uq_exams_one_active_per_owner ON exams (owner_id) WHERE is_active;

CREATE TABLE IF NOT EXISTS subjects (
  owner_id UUID NOT NULL,
  exam_id TEXT NOT NULL,
  id TEXT NOT NULL CHECK (char_length(id) BETWEEN 1 AND 255),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  color TEXT NOT NULL DEFAULT '#3B82F6' CHECK (char_length(color) <= 32),
  icon_name TEXT CHECK (icon_name IS NULL OR char_length(icon_name) <= 64),
  has_custom_sequence BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (owner_id, exam_id, id),
  FOREIGN KEY (owner_id, exam_id) REFERENCES exams (owner_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS topics (
  owner_id UUID NOT NULL,
  exam_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  id TEXT NOT NULL CHECK (char_length(id) BETWEEN 1 AND 255),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  difficulty TEXT NOT NULL DEFAULT 'average' CHECK (difficulty IN ('weak', 'average', 'strong')),
  mastery_score NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  revision_interval_days NUMERIC(6, 2) NOT NULL DEFAULT 3 CHECK (revision_interval_days > 0),
  last_reviewed DATE,
  total_sessions_completed INTEGER NOT NULL DEFAULT 0 CHECK (total_sessions_completed >= 0),
  recent_score NUMERIC(5, 2) CHECK (recent_score IS NULL OR (recent_score >= 0 AND recent_score <= 100)),
  sequence_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (owner_id, exam_id, id),
  FOREIGN KEY (owner_id, exam_id, subject_id) REFERENCES subjects (owner_id, exam_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics (owner_id, exam_id, subject_id);

CREATE TABLE IF NOT EXISTS study_sessions (
  owner_id UUID NOT NULL,
  id TEXT NOT NULL CHECK (char_length(id) BETWEEN 1 AND 255),
  exam_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  subject_name TEXT NOT NULL CHECK (char_length(subject_name) BETWEEN 1 AND 200),
  topic_name TEXT NOT NULL CHECK (char_length(topic_name) BETWEEN 1 AND 200),
  session_date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (char_length(time_slot) BETWEEN 1 AND 32),
  preferred_period TEXT NOT NULL CHECK (preferred_period IN ('early_morning', 'morning', 'afternoon', 'evening', 'night')),
  duration_minutes NUMERIC(6, 2) NOT NULL DEFAULT 60 CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
  session_type TEXT NOT NULL CHECK (session_type IN ('learn', 'practice', 'revision', 'test')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('weak', 'average', 'strong')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped', 'rescheduled')),
  completed_at TIMESTAMPTZ,
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  is_priority_boosted BOOLEAN NOT NULL DEFAULT FALSE,
  topic_sequence_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, exam_id, subject_id) REFERENCES subjects (owner_id, exam_id, id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id, exam_id, topic_id) REFERENCES topics (owner_id, exam_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_exam_date ON study_sessions (owner_id, exam_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON study_sessions (owner_id, status);

CREATE TABLE IF NOT EXISTS practice_scores (
  owner_id UUID NOT NULL,
  id TEXT NOT NULL CHECK (char_length(id) BETWEEN 1 AND 255),
  exam_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  subject_name TEXT NOT NULL CHECK (char_length(subject_name) BETWEEN 1 AND 200),
  topic_name TEXT NOT NULL CHECK (char_length(topic_name) BETWEEN 1 AND 200),
  score_percentage NUMERIC(5, 2) NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
  total_questions INTEGER NOT NULL CHECK (total_questions >= 1 AND total_questions <= 200),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  score_date DATE NOT NULL,
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  impact_action_taken TEXT CHECK (impact_action_taken IS NULL OR char_length(impact_action_taken) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (owner_id, id),
  CONSTRAINT practice_scores_correct_le_total CHECK (correct_answers <= total_questions),
  FOREIGN KEY (owner_id, exam_id, subject_id) REFERENCES subjects (owner_id, exam_id, id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id, exam_id, topic_id) REFERENCES topics (owner_id, exam_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scores_exam_date ON practice_scores (owner_id, exam_id, score_date);