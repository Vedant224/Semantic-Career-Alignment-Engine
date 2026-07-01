-- ============================================================================
-- Semantic Career Alignment Engine — Supabase Initialization
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- ============================================================================

-- ─── Step 1: Enable the pgvector extension ─────────────────────────────────
-- Required for vector storage and similarity search.
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Step 2: Create the career_profiles table ───────────────────────────────
-- Stores user career graphs as JSONB with an optional 768-dim embedding
-- (matches Gemini text-embedding-004 output dimensionality).
CREATE TABLE IF NOT EXISTS career_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name     TEXT NOT NULL,
  profile_data  JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding     vector(768),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by user name.
CREATE INDEX IF NOT EXISTS idx_career_profiles_user_name
  ON career_profiles (user_name);

-- HNSW index for fast approximate nearest-neighbor search on embeddings.
-- Using cosine distance operator class for normalized embeddings.
CREATE INDEX IF NOT EXISTS idx_career_profiles_embedding
  ON career_profiles
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Auto-update the updated_at timestamp on row modification.
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

-- ─── Step 3: Vector similarity search function ──────────────────────────────
-- Takes a query embedding and returns the closest matching profiles
-- ranked by cosine similarity (1 - cosine distance).
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

-- ─── Verification ───────────────────────────────────────────────────────────
-- After running, verify with:
--   SELECT * FROM pg_extension WHERE extname = 'vector';
--   \d career_profiles
--   \df match_career_profiles
