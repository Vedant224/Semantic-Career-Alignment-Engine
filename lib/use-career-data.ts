"use client";

import { useState, useEffect, useCallback } from "react";
import type { CareerGraph } from "@/lib/types";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { getCareerGraph } from "@/lib/career-store";

// ─── Constants ──────────────────────────────────────────────────────────────

const LOCAL_STORAGE_KEY = "career-graph-data";
const STORAGE_MODE_KEY = "career-storage-mode";

// ─── Types ──────────────────────────────────────────────────────────────────

export type StorageMode = "local" | "cloud";

export interface UseCareerDataReturn {
  /** The current career graph (null while loading). */
  graph: CareerGraph | null;
  /** Whether a load or save operation is in progress. */
  isLoading: boolean;
  /** Whether a save operation is in progress. */
  isSaving: boolean;
  /** Last error message, if any. */
  error: string | null;
  /** Current storage mode. */
  storageMode: StorageMode;
  /** Whether Supabase is configured and cloud mode is available. */
  isCloudAvailable: boolean;
  /** Save the given graph to the active storage backend. */
  save: (graph: CareerGraph) => Promise<void>;
  /** Load the graph from the active storage backend. */
  load: () => Promise<void>;
  /** Update the in-memory graph (does NOT auto-save). */
  setGraph: (graph: CareerGraph) => void;
  /** Toggle between 'local' and 'cloud', persisting the preference. */
  toggleStorageMode: () => void;
  /** Explicitly set the storage mode. */
  setStorageMode: (mode: StorageMode) => void;
}

// ─── LocalStorage helpers ───────────────────────────────────────────────────

function loadFromLocalStorage(): CareerGraph | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    
    // Check if it uses the new wrapped format { data, timestamp }
    if (parsed && typeof parsed === "object" && "timestamp" in parsed && "data" in parsed) {
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > ONE_DAY) {
        console.log("[useCareerData] Local storage data expired (older than 1 day). Clearing.");
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return null;
      }
      return parsed.data as CareerGraph;
    }
    
    // Legacy format fallback (no expiration)
    return parsed as CareerGraph;
  } catch {
    console.warn("[useCareerData] Failed to parse localStorage data");
    return null;
  }
}

function saveToLocalStorage(graph: CareerGraph): void {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      data: graph,
      timestamp: Date.now()
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("[useCareerData] Failed to write to localStorage:", err);
  }
}

function getPersistedStorageMode(): StorageMode {
  if (typeof window === "undefined") return "local";
  const stored = localStorage.getItem(STORAGE_MODE_KEY);
  return stored === "cloud" ? "cloud" : "local";
}

function persistStorageMode(mode: StorageMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_MODE_KEY, mode);
}

// ─── Supabase helpers ───────────────────────────────────────────────────────

/** Default user name for single-user / anonymous mode. */
const DEFAULT_USER = "default";

async function loadFromSupabase(
  userName: string = DEFAULT_USER
): Promise<CareerGraph | null> {
  const supabase = getSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("career_profiles")
    .select("profile_data")
    .eq("user_name", userName)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // PGRST116 = "no rows returned" — not a real error for us.
    if ((error as { code?: string }).code === "PGRST116") return null;
    
    // Check if relation does not exist (user didn't run SQL script)
    if ((error as { code?: string }).code === "42P01") {
      throw new Error("Supabase table 'career_profiles' does not exist. Please run the SQL setup script.");
    }
    
    throw new Error(
      `Supabase load failed: ${(error as { message: string }).message}`
    );
  }

  const row = data as { profile_data?: unknown } | null;
  return (row?.profile_data as CareerGraph) ?? null;
}

async function saveToSupabase(
  graph: CareerGraph,
  userName: string = DEFAULT_USER
): Promise<void> {
  const supabase = getSupabaseClient();

  // 1. Generate overall profile embedding
  const profileString = [
    graph.headline,
    "Skills: " + graph.skills.map(s => s.name).join(", "),
    "Experience: " + graph.experiences.map(e => `${e.role} at ${e.company}. ${e.description}`).join(" ")
  ].join("\n");

  let embedding: number[] | null = null;
  try {
    const res = await fetch("/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: [profileString] }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.embeddings && data.embeddings[0]) {
        embedding = data.embeddings[0];
      }
    }
  } catch (err) {
    console.warn("[saveToSupabase] Failed to generate embedding:", err);
  }

  // First, check if a profile already exists for this user
  const { data: existing } = await (supabase as any)
    .from("career_profiles")
    .select("id")
    .eq("user_name", userName)
    .limit(1)
    .maybeSingle();

  let error;
  if (existing?.id) {
    // Update existing profile
    const result = await (supabase as any)
      .from("career_profiles")
      .update({ profile_data: graph, embedding })
      .eq("id", existing.id);
    error = result.error;
  } else {
    // Insert new profile
    const result = await (supabase as any)
      .from("career_profiles")
      .insert({ user_name: userName, profile_data: graph, embedding });
    error = result.error;
  }

  if (error) {
    if ((error as { code?: string }).code === "42P01") {
      throw new Error("Supabase table 'career_profiles' does not exist. Please run the SQL setup script.");
    }
    throw new Error(
      `Supabase save failed: ${(error as { message: string }).message}`
    );
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * `useCareerData` — Dual-storage hook for the career graph.
 *
 * Supports two modes:
 * - **local**: reads/writes to `localStorage` (works offline, no setup).
 * - **cloud**: reads/writes to the Supabase `career_profiles` table.
 *
 * The mode persists across page reloads via `localStorage`.
 * Falls back to local mode if Supabase is not configured.
 */
export function useCareerData(): UseCareerDataReturn {
  const cloudAvailable = isSupabaseConfigured();

  const [storageMode, setStorageModeState] = useState<StorageMode>("local");
  const [graph, setGraph] = useState<CareerGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Resolve persisted storage mode on mount ──
  useEffect(() => {
    const persisted = getPersistedStorageMode();
    // If user chose cloud but Supabase isn't configured, fall back to local.
    setStorageModeState(
      persisted === "cloud" && cloudAvailable ? "cloud" : "local"
    );
  }, [cloudAvailable]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let loaded: CareerGraph | null = null;

      if (storageMode === "cloud" && cloudAvailable) {
        loaded = await loadFromSupabase();
      } else {
        loaded = loadFromLocalStorage();
      }

      if (loaded) {
        setGraph(loaded);
      } else {
        const fallback = await getCareerGraph();
        setGraph(fallback);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
      console.error("[useCareerData] load error:", msg);
    } finally {
      setIsLoading(false);
    }
  }, [storageMode, cloudAvailable]);

  // Auto-load on mount and when storage mode changes.
  useEffect(() => {
    load();
  }, [load]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(
    async (graphToSave: CareerGraph) => {
      setIsSaving(true);
      setError(null);

      try {
        if (storageMode === "cloud" && cloudAvailable) {
          await saveToSupabase(graphToSave);
        } else {
          saveToLocalStorage(graphToSave);
        }

        setGraph(graphToSave);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save data";
        setError(msg);
        console.error("[useCareerData] save error:", msg);
      } finally {
        setIsSaving(false);
      }
    },
    [storageMode, cloudAvailable]
  );

  // ── Toggle ────────────────────────────────────────────────────────────────
  const toggleStorageMode = useCallback(() => {
    setStorageModeState((prev) => {
      const next: StorageMode =
        prev === "local" ? (cloudAvailable ? "cloud" : "local") : "local";
      persistStorageMode(next);
      return next;
    });
  }, [cloudAvailable]);

  const setStorageMode = useCallback(
    (mode: StorageMode) => {
      const resolved =
        mode === "cloud" && !cloudAvailable ? "local" : mode;
      setStorageModeState(resolved);
      persistStorageMode(resolved);
    },
    [cloudAvailable]
  );

  return {
    graph,
    isLoading,
    isSaving,
    error,
    storageMode,
    isCloudAvailable: cloudAvailable,
    save,
    load,
    setGraph,
    toggleStorageMode,
    setStorageMode,
  };
}
