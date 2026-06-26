import { query } from "@/lib/db"
import type { CareerGraph } from "@/lib/types"

/**
 * POST /api/career-graphs/save
 * Saves or updates a career graph to Aurora PostgreSQL.
 *
 * Request body:
 * {
 *   name: string (unique identifier for this graph)
 *   graph: CareerGraph (the full career profile)
 * }
 *
 * Response:
 * { id: number, name: string, created_at: string, updated_at: string }
 */
export async function POST(req: Request) {
  try {
    const { name, graph } = (await req.json()) as {
      name: string
      graph: CareerGraph
    }

    if (!name || !graph) {
      return Response.json(
        { error: "Missing name or graph in request body" },
        { status: 400 },
      )
    }

    // Upsert: try to update, if no rows affected, insert
    const result = await query(
      `
      INSERT INTO career_graphs (
        name, profile_name, headline, contact, 
        experiences, skills, projects, education, certifications,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET
        profile_name = $2,
        headline = $3,
        contact = $4,
        experiences = $5,
        skills = $6,
        projects = $7,
        education = $8,
        certifications = $9,
        updated_at = NOW()
      RETURNING id, name, created_at, updated_at
      `,
      [
        name,
        graph.profileName,
        graph.headline,
        JSON.stringify(graph.contact),
        JSON.stringify(graph.experiences),
        JSON.stringify(graph.skills),
        JSON.stringify(graph.projects),
        JSON.stringify(graph.education),
        JSON.stringify(graph.certifications),
      ],
    )

    if (!result.rows.length) {
      return Response.json({ error: "Failed to save career graph" }, { status: 500 })
    }

    const saved = result.rows[0]
    return Response.json(
      {
        id: saved.id,
        name: saved.name,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Career graph save error:", error)
    return Response.json(
      { error: "Failed to save career graph", details: String(error) },
      { status: 500 },
    )
  }
}
