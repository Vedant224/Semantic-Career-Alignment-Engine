-- ============================================================================
-- Semantic Career Alignment Engine — Vector Math
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- Function to compute cosine similarity between an array of target embeddings (JD requirements)
-- and an array of skill embeddings (Profile skills).
-- For each target embedding, it finds the MAXIMUM similarity score against any profile skill.
-- Returns an array of max similarity scores corresponding to each JD requirement.
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
  
  -- If either array is empty, return empty
  IF array_length(target_embeddings, 1) IS NULL OR array_length(skill_embeddings, 1) IS NULL THEN
    RETURN max_similarities;
  END IF;

  FOR i IN 1..array_length(target_embeddings, 1) LOOP
    current_max := -1.0;
    
    FOR j IN 1..array_length(skill_embeddings, 1) LOOP
      -- Compute similarity: 1 - cosine_distance
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
