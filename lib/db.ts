import { Pool, type ClientBase } from "pg"
import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { attachDatabasePool } from "@vercel/functions"

/**
 * Aurora PostgreSQL connection layer (IAM auth) — prepared for pgvector.
 *
 * The pool is created lazily so the application runs fine BEFORE the Amazon
 * Aurora PostgreSQL integration is connected. Once the integration is added at
 * the end of the project, `PGHOST` / `AWS_REGION` / `AWS_ROLE_ARN` become
 * available and queries route through here automatically.
 *
 * To finish wiring the database:
 *   1. Connect the Amazon Aurora PostgreSQL integration.
 *   2. Run scripts/001-setup-career-graph-schema.sql (enables the `vector`
 *      extension and creates the tables + ivfflat indexes).
 *   3. Swap lib/career-store.ts read/write functions for parameterized queries
 *      via `query()` / `withConnection()` below.
 */

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.PGHOST && process.env.AWS_REGION && process.env.AWS_ROLE_ARN)
}

let pool: Pool | null = null

function getPool(): Pool {
  if (pool) return pool

  if (!isDatabaseConfigured()) {
    throw new Error(
      "Aurora PostgreSQL is not configured yet. Connect the integration and set PGHOST, AWS_REGION, and AWS_ROLE_ARN.",
    )
  }

  const signer = new Signer({
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION },
    }),
    region: process.env.AWS_REGION,
    hostname: process.env.PGHOST!,
    username: process.env.PGUSER || "postgres",
    port: 5432,
  })

  pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE || "postgres",
    port: 5432,
    user: process.env.PGUSER || "postgres",
    // Token is regenerated per connection; cacheable up to 15 minutes.
    password: () => signer.getAuthToken(),
    // Switch to `true` (with the RDS CA bundle) in production.
    ssl: { rejectUnauthorized: false },
    max: 20,
  })
  attachDatabasePool(pool)
  return pool
}

/** Single-statement parameterized query. */
export async function query(text: string, params?: unknown[]) {
  return getPool().query(text, params)
}

/** Multi-statement transactions. */
export async function withConnection<T>(fn: (client: ClientBase) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    return await fn(client)
  } finally {
    ;(client as { release?: () => void }).release?.()
  }
}
