"use client"

import { useState } from "react"
import type { CareerGraph } from "@/lib/types"

export interface SavedGraph {
  id: number
  name: string
  profile_name: string
  headline: string
  created_at: string
  updated_at: string
}

export interface GraphMetadata {
  id: number
  graph: CareerGraph
  created_at: string
  updated_at: string
}

/**
 * useCareerDb — Client-side hook for career graph database operations.
 * Provides methods to save, load, list, and delete career graphs from Aurora PostgreSQL.
 *
 * Usage:
 * const db = useCareerDb()
 * await db.save("my-graph", careerGraphData)
 * const loaded = await db.load("my-graph")
 * const all = await db.list()
 * await db.delete("my-graph")
 */
export function useCareerDb() {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (name: string, graph: CareerGraph): Promise<SavedGraph | null> => {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/career-graphs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, graph }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save graph")
      }

      return await res.json()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
      console.error("[v0] Graph save failed:", msg)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const load = async (name: string): Promise<GraphMetadata | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/career-graphs/load?name=${encodeURIComponent(name)}`)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to load graph")
      }

      return await res.json()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
      console.error("[v0] Graph load failed:", msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const list = async (): Promise<SavedGraph[]> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/career-graphs/list")

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to list graphs")
      }

      const data = await res.json()
      return data.graphs || []
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
      console.error("[v0] Graph list failed:", msg)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const delete_ = async (name: string): Promise<boolean> => {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/career-graphs/delete?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete graph")
      }

      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
      console.error("[v0] Graph delete failed:", msg)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    save,
    load,
    list,
    delete: delete_,
    isSaving,
    isLoading,
    error,
  }
}
