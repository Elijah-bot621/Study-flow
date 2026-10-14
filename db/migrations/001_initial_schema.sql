-- Study Flow migration 001: initial schema.
-- Anonymous owners plus owner-scoped study data.
-- Safe to re-run: uses IF NOT EXISTS. Contains no destructive statements.
-- Never edit this file after it has been applied. Add 002_*.sql instead.

CREATE TABLE IF NOT EXISTS owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exams (
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  id text NOT NULL,
  title text NOT NULL,
  exam_type text NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC', 'NECO', 'POST_UTME', 'UNIVERSITY', 'CUSTOM')),
  exam_date text NOT NULL,
  daily_study_hours numeric(4, 2) NOT NULL CHECK (daily_study_hours >= 0.5 AND daily_study_hours <= 12),
  preferred_periods jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE IF NOT EXISTS subjects (
  owner_id uuid NOT NULL,
  exam_id text NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  icon_name text,
  has_custom_sequence boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, exam_id) REFERENCES exams(owner_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS topics (
  owner_id uuid NOT NULL,
  exam_id text NOT NULL,
  subject_id text NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  difficulty text NOT NULL DEFAULT 'average' CHECK (difficulty IN ('weak', 'average', 'strong')),
  mastery_score integer NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  revision_interval_days integer NOT NULL DEFAULT 3 CHECK (revision_interval_days >= 1),
  last_reviewed text,
  total_sessions_completed integer NOT NULL DEFAULT 0 CHECK (total_sessions_completed >= 0),
  recent_score numeric(5, 2) CHECK (recent_score IS NULL OR (recent_score >= 0 AND recent_score <= 100)),
  sequence_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, exam_id) REFERENCES exams(owner_id, id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id, subject_id) REFERENCES subjects(owner_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_sessions (
  owner_id uuid NOT NULL,
  exam_id text NOT NULL,
  id text NOT NULL,
  subject_id text NOT NULL,
  topic_id text NOT NULL,
  subject_name text NOT NULL,
  topic_name text NOT NULL,
  date text NOT NULL,
  time_slot text NOT NULL,
  preferred_period text NOT NULL CHECK (preferred_period IN ('early_morning', 'morning', 'afternoon', 'evening', 'night')),
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  session_type text NOT NULL CHECK (session_type IN ('learn', 'practice', 'revision', 'test')),
  difficulty text NOT NULL CHECK (difficulty IN ('weak', 'average', 'strong')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped', 'rescheduled')),
  completed_at text,
  notes text,
  is_priority_boosted boolean NOT NULL DEFAULT false,
  topic_sequence_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, exam_id) REFERENCES exams(owner_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS practice_scores (
  owner_id uuid NOT NULL,
  exam_id text NOT NULL,
  id text NOT NULL,
  subject_id text NOT NULL,
  topic_id text NOT NULL,
  subject_name text NOT NULL,
  topic_name text NOT NULL,
  score_percentage numeric(5, 2) NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
  total_questions integer NOT NULL CHECK (total_questions >= 1 AND total_questions <= 200),
  correct_answers integer NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
  date text NOT NULL,
  notes text,
  impact_action_taken text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, exam_id) REFERENCES exams(owner_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exams_owner ON exams(owner_id);
CREATE INDEX IF NOT EXISTS idx_exams_active ON exams(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_exam ON subjects(owner_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(owner_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_exam ON topics(owner_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_sessions_owner_date ON study_sessions(owner_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_exam ON study_sessions(owner_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON study_sessions(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_practice_scores_exam_date ON practice_scores(owner_id, exam_id, date);
