-- Semantic Career Alignment Engine — Career Graph Schema
-- Run AFTER the Amazon Aurora PostgreSQL integration is connected.

-- Enable pgvector extension (optional, for future semantic search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Career graphs table: stores complete user career profiles
-- For single-user / anonymous mode, typically one active graph at a time
CREATE TABLE IF NOT EXISTS career_graphs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Graph metadata
  name VARCHAR(255) NOT NULL UNIQUE,
  profile_name VARCHAR(255) NOT NULL,
  headline VARCHAR(255) NOT NULL,
  
  -- Contact information
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { email, phone, location, website, github, linkedin }
  
  -- Complete career data as JSONB
  -- experiences: array of { role, company, location, period, description, metrics, bullets }
  experiences JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- skills: array of { name, category, years }
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- projects: array of { name, description, techStack, link, highlight, bullets }
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- education: array of { institution, degree, period, location }
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- certifications: array of { name, issuer, link }
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT pk_career_graphs PRIMARY KEY (id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_career_graphs_name ON career_graphs(name);
CREATE INDEX IF NOT EXISTS idx_career_graphs_updated_at ON career_graphs(updated_at DESC);

-- Alignments table (optional): stores job alignment analysis results
CREATE TABLE IF NOT EXISTS alignments (
  id BIGSERIAL PRIMARY KEY,
  graph_id BIGINT NOT NULL REFERENCES career_graphs(id) ON DELETE CASCADE,
  
  -- Job description that was analyzed
  job_description TEXT NOT NULL,
  
  -- Alignment results
  score DECIMAL(5, 2),
  matched_skills JSONB,
  partial_skills JSONB,
  skill_gaps JSONB,
  generated_resume JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT pk_alignments PRIMARY KEY (id),
  CONSTRAINT fk_alignments_graph FOREIGN KEY (graph_id) REFERENCES career_graphs(id) ON DELETE CASCADE
);

-- Indexes for alignment queries
CREATE INDEX IF NOT EXISTS idx_alignments_graph_id ON alignments(graph_id);
CREATE INDEX IF NOT EXISTS idx_alignments_created_at ON alignments(created_at DESC);
