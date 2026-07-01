import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Database row shape for the `career_profiles` table.
 */
export interface CareerProfileRow {
  id: string;
  user_name: string;
  profile_data: Record<string, unknown>;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase database type definition for typed queries.
 */
export interface Database {
  public: {
    Tables: {
      career_profiles: {
        Row: CareerProfileRow;
        Insert: Omit<CareerProfileRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<
          Omit<CareerProfileRow, "id" | "created_at" | "updated_at">
        >;
      };
    };
    Functions: {
      match_career_profiles: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          user_name: string;
          profile_data: Record<string, unknown>;
          similarity: number;
        }[];
      };
    };
  };
}

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Returns true if the Supabase environment variables are configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Get (or create) the Supabase client singleton.
 * Throws if the required env vars are not set.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  supabaseInstance = createClient<Database>(url, anonKey);
  return supabaseInstance;
}
