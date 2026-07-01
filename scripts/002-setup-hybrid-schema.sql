-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the career_profiles table
create table career_profiles (
  id uuid primary key default gen_random_uuid(),
  user_name text not null unique,
  profile_data jsonb not null,
  embedding vector(768),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on career_profiles
create trigger update_career_profiles_updated_at
  before update on career_profiles
  for each row
  execute function update_updated_at_column();

-- Function for vector similarity search (cosine distance)
create or replace function match_career_profiles (
  query_embedding vector(768),
  match_threshold float default 0.5,
  match_count int default 3
)
returns table (
  id uuid,
  user_name text,
  profile_data jsonb,
  similarity float
)
language sql
as $$
  select
    career_profiles.id,
    career_profiles.user_name,
    career_profiles.profile_data,
    1 - (career_profiles.embedding <=> query_embedding) as similarity
  from career_profiles
  where 1 - (career_profiles.embedding <=> query_embedding) > match_threshold
  order by career_profiles.embedding <=> query_embedding
  limit match_count;
$$;
