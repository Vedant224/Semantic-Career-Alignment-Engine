-- ============================================================================
-- Semantic Career Alignment Engine — Supabase Setup
-- Run this ONCE in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- ============================================================================

-- ─── Step 1: Enable pgvector ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Step 2: Career Profiles Table ──────────────────────────────────────────
-- Stores user career graphs as JSONB with an optional embedding vector.
CREATE TABLE IF NOT EXISTS career_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name     TEXT NOT NULL,
  profile_data  JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding     vector(768),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_profiles_user_name
  ON career_profiles (user_name);

CREATE INDEX IF NOT EXISTS idx_career_profiles_embedding
  ON career_profiles
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Auto-update updated_at on row modification.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_career_profiles_updated_at ON career_profiles;
CREATE TRIGGER trg_career_profiles_updated_at
  BEFORE UPDATE ON career_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── Step 3: Profile Similarity Search ──────────────────────────────────────
-- Find the closest matching career profiles to a query embedding.
CREATE OR REPLACE FUNCTION match_career_profiles(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count     INT   DEFAULT 5
)
RETURNS TABLE (
  id              UUID,
  user_name       TEXT,
  profile_data    JSONB,
  similarity      FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cp.id,
    cp.user_name,
    cp.profile_data,
    1 - (cp.embedding <=> query_embedding) AS similarity
  FROM career_profiles cp
  WHERE cp.embedding IS NOT NULL
    AND 1 - (cp.embedding <=> query_embedding) > match_threshold
  ORDER BY cp.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ─── Step 4: Vector Math for Alignment ──────────────────────────────────────
-- Computes cosine similarity between arrays of JD requirement embeddings
-- and profile skill embeddings. For each JD requirement, returns the
-- maximum similarity score against any profile skill.
CREATE OR REPLACE FUNCTION get_max_similarities(
  target_embeddings vector(768)[],
  skill_embeddings vector(768)[]
)
RETURNS float[]
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  max_similarities float[];
  current_max float;
  sim float;
  i integer;
  j integer;
BEGIN
  max_similarities := ARRAY[]::float[];

  IF array_length(target_embeddings, 1) IS NULL OR array_length(skill_embeddings, 1) IS NULL THEN
    RETURN max_similarities;
  END IF;

  FOR i IN 1..array_length(target_embeddings, 1) LOOP
    current_max := -1.0;

    FOR j IN 1..array_length(skill_embeddings, 1) LOOP
      sim := (1 - (target_embeddings[i] <=> skill_embeddings[j]))::float;
      IF sim > current_max THEN
        current_max := sim;
      END IF;
    END LOOP;

    max_similarities := array_append(max_similarities, current_max);
  END LOOP;

  RETURN max_similarities;
END;
$$;

-- ─── Step 5: Row-Level Security ─────────────────────────────────────────────
-- Enable RLS and allow anonymous read/write (single-user / hackathon mode).
ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous access" ON career_profiles;
CREATE POLICY "Allow anonymous access" ON career_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- ─── Verification ───────────────────────────────────────────────────────────
-- After running, verify with:
--   SELECT * FROM pg_extension WHERE extname = 'vector';
--   \d career_profiles
--   \df match_career_profiles
--   \df get_max_similarities
