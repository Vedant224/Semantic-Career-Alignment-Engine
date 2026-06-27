import { query } from "@/lib/db"
import type { CareerGraph } from "@/lib/types"

/**
 * GET /api/career-graphs/load?name=graph_name
 * Retrieves a saved career graph by name.
 *
 * Response:
 * {
 *   id: number,
 *   graph: CareerGraph,
 *   created_at: string,
 *   updated_at: string
 * }
 * or
 * { error: "Graph not found" } (404)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const name = url.searchParams.get("name")

    if (!name) {
      return Response.json({ error: "Missing name query parameter" }, { status: 400 })
    }

    const result = await query(
      `
      SELECT 
        id, name, profile_name, headline, contact,
        experiences, skills, projects, education, certifications,
        created_at, updated_at
      FROM career_graphs
      WHERE name = $1
      LIMIT 1
      `,
      [name],
    )

    if (!result.rows.length) {
      return Response.json({ error: "Graph not found" }, { status: 404 })
    }

    const row = result.rows[0]
    const graph: CareerGraph = {
      profileName: row.profile_name,
      headline: row.headline,
      contact: row.contact,
      experiences: row.experiences,
      skills: row.skills,
      projects: row.projects,
      education: row.education,
      certifications: row.certifications,
    }

    return Response.json(
      {
        id: row.id,
        graph,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Career graph load error:", error)
    return Response.json(
      { error: "Failed to load career graph", details: String(error) },
      { status: 500 },
    )
  }
}
