-- StudyFlow Database Schema Migration 001
-- Initial schema: Multi-tenant isolated storage for anonymous student installations
-- All data rows belong to exactly one owner via owner_id

-- 1. Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Anonymous Owners Table
-- Represents each app installation.
-- No personal information or recovery codes are stored.
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Exams
CREATE TABLE IF NOT EXISTS exams (
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  id VARCHAR(100) NOT NULL,
  title VARCHAR(150) NOT NULL,
  exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC', 'NECO', 'POST_UTME', 'UNIVERSITY', 'CUSTOM')),
  exam_date VARCHAR(20) NOT NULL,
  daily_study_hours NUMERIC(4, 2) NOT NULL CHECK (daily_study_hours >= 0.5 AND daily_study_hours <= 12),
  preferred_periods JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, id)
);

-- 4. Subjects
CREATE TABLE IF NOT EXISTS subjects (
  owner_id UUID NOT NULL,
  exam_id VARCHAR(100) NOT NULL,
  id VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL DEFAULT '#3B82F6',
  icon_name VARCHAR(50),
  has_custom_sequence BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, exam_id) REFERENCES exams(owner_id, id) ON DELETE CASCADE
);

-- 5. Topics
CREATE TABLE IF NOT EXISTS topics (
  owner_id UUID NOT NULL,
  exam_id VARCHAR(100) NOT NULL,
  subject_id VARCHAR(100) NOT NULL,
  id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'average' CHECK (difficulty IN ('weak', 'average', 'strong')),
  mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  revision_interval_days INTEGER NOT NULL DEFAULT 3 CHECK (revision_interval_days >= 1),
  last_reviewed VARCHAR(50),
  total_sessions_completed INTEGER NOT NULL DEFAULT 0 CHECK (total_sessions_completed >= 0),
  recent_score NUMERIC(5, 2) CHECK (recent_score IS NULL OR (recent_score >= 0 AND recent_score <= 100)),
  sequence_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, exam_id) REFERENCES exams(owner_id, id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id, subject_id) REFERENCES subjects(owner_id, id) ON DELETE CASCADE
);

-- 6. Study Sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  owner_id UUID NOT NULL,
  exam_id VARCHAR(100) NOT NULL,
  id VARCHAR(100) NOT NULL,
  subject_id VARCHAR(100) NOT NULL,
  topic_id VARCHAR(100) NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  topic_name VARCHAR(200) NOT NULL,
  date VARCHAR(20) NOT NULL,
  time_slot VARCHAR(100) NOT NULL,
  preferred_period VARCHAR(50) NOT NULL CHECK (preferred_period IN ('early_morning', 'morning', 'afternoon', 'evening', 'night')),
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  session_type VARCHAR(30) NOT NULL CHECK (session_type IN ('learn', 'practice', 'revision', 'test')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('weak', 'average', 'strong')),
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped', 'rescheduled')),
  completed_at VARCHAR(50),
  notes TEXT,
  is_priority_boosted BOOLEAN NOT NULL DEFAULT false,
  topic_sequence_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, exam_id) REFERENCES exams(owner_id, id) ON DELETE CASCADE
);

-- 7. Practice Scores
CREATE TABLE IF NOT EXISTS practice_scores (
  owner_id UUID NOT NULL,
  exam_id VARCHAR(100) NOT NULL,
  id VARCHAR(100) NOT NULL,
  subject_id VARCHAR(100) NOT NULL,
  topic_id VARCHAR(100) NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  topic_name VARCHAR(200) NOT NULL,
  score_percentage NUMERIC(5, 2) NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
  total_questions INTEGER NOT NULL CHECK (total_questions >= 1 AND total_questions <= 200),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
  date VARCHAR(20) NOT NULL,
  notes TEXT,
  impact_action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, id),
  FOREIGN KEY (owner_id, exam_id) REFERENCES exams(owner_id, id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_exams_owner ON exams(owner_id);
CREATE INDEX IF NOT EXISTS idx_exams_active ON exams(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_exam ON subjects(owner_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(owner_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_exam ON topics(owner_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_sessions_owner_date ON study_sessions(owner_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_exam ON study_sessions(owner_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON study_sessions(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_practice_scores_exam_date ON practice_scores(owner_id, exam_id, date);
