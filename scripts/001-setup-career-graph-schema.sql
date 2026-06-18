-- Semantic Career Alignment Engine — schema with pgvector.
-- Run AFTER the Amazon Aurora PostgreSQL integration is connected.

-- 1. Enable vector similarity search.
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Career profile (one row per user; single-user for now).
CREATE TABLE IF NOT EXISTS career_profiles (
  id           SERIAL PRIMARY KEY,
  profile_name VARCHAR(120) NOT NULL,
  headline     VARCHAR(160) NOT NULL DEFAULT '',
  summary      TEXT         NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 3. Skills. Each skill carries an embedding for semantic matching.
CREATE TABLE IF NOT EXISTS skills (
  id         SERIAL PRIMARY KEY,
  profile_id INT NOT NULL REFERENCES career_profiles(id) ON DELETE CASCADE,
  name       VARCHAR(80) NOT NULL,
  level      VARCHAR(20) NOT NULL DEFAULT 'Intermediate'
             CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  years      INT NOT NULL DEFAULT 0,
  -- 1536 dims matches OpenAI text-embedding-3-small; adjust per model.
  embedding  vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Experiences. Descriptions are embedded for evidence matching.
CREATE TABLE IF NOT EXISTS experiences (
  id          SERIAL PRIMARY KEY,
  profile_id  INT NOT NULL REFERENCES career_profiles(id) ON DELETE CASCADE,
  role        VARCHAR(120) NOT NULL,
  company     VARCHAR(120) NOT NULL,
  start_date  VARCHAR(20)  NOT NULL DEFAULT '',
  end_date    VARCHAR(20)  NOT NULL DEFAULT '',
  description TEXT         NOT NULL DEFAULT '',
  embedding   vector(1536),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 5. Quantified metrics tied to an experience.
CREATE TABLE IF NOT EXISTS experience_metrics (
  id            SERIAL PRIMARY KEY,
  experience_id INT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  label         VARCHAR(120) NOT NULL,
  value         VARCHAR(80)  NOT NULL
);

-- 6. Foreign-key indexes (PostgreSQL does NOT auto-index FKs).
CREATE INDEX IF NOT EXISTS idx_skills_profile_id ON skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_experiences_profile_id ON experiences(profile_id);
CREATE INDEX IF NOT EXISTS idx_metrics_experience_id ON experience_metrics(experience_id);

-- 7. Approximate-nearest-neighbor indexes for cosine similarity.
--    (ivfflat requires data present before ANALYZE; lists tuned to row count.)
CREATE INDEX IF NOT EXISTS idx_skills_embedding
  ON skills USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_experiences_embedding
  ON experiences USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
