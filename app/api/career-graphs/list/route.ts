import { query } from "@/lib/db"

/**
 * GET /api/career-graphs/list
 * Lists all saved career graphs (names, metadata, timestamps).
 *
 * Response:
 * {
 *   graphs: [
 *     { id, name, profile_name, headline, created_at, updated_at },
 *     ...
 *   ]
 * }
 */
export async function GET() {
  try {
    const result = await query(
      `
      SELECT 
        id, name, profile_name, headline,
        created_at, updated_at
      FROM career_graphs
      ORDER BY updated_at DESC
      `,
    )

    return Response.json(
      {
        graphs: result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          profile_name: row.profile_name,
          headline: row.headline,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Career graph list error:", error)
    return Response.json(
      { error: "Failed to list career graphs", details: String(error) },
      { status: 500 },
    )
  }
}
