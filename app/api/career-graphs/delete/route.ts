import { query } from "@/lib/db"

/**
 * DELETE /api/career-graphs/delete?name=graph_name
 * Deletes a saved career graph by name.
 *
 * Response:
 * { success: true, deleted_id: number }
 * or
 * { error: "Graph not found" } (404)
 */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const name = url.searchParams.get("name")

    if (!name) {
      return Response.json({ error: "Missing name query parameter" }, { status: 400 })
    }

    const result = await query(
      `
      DELETE FROM career_graphs
      WHERE name = $1
      RETURNING id
      `,
      [name],
    )

    if (!result.rows.length) {
      return Response.json({ error: "Graph not found" }, { status: 404 })
    }

    return Response.json(
      {
        success: true,
        deleted_id: result.rows[0].id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Career graph delete error:", error)
    return Response.json(
      { error: "Failed to delete career graph", details: String(error) },
      { status: 500 },
    )
  }
}
