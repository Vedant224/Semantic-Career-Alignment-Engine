# AWS Aurora PostgreSQL Database Integration

## Overview

The Semantic Career Alignment Engine includes first-class support for **AWS Aurora PostgreSQL** to persist career graphs. This document explains the architecture, setup process, and how to use the database APIs.

## Architecture

### Design Principles

1. **JSONB Storage** — Career graphs are stored as complete JSON documents (not heavily normalized) for flexibility and ease of retrieval
2. **Type Safety** — Full TypeScript types from `lib/types.ts` are preserved end-to-end
3. **No Passwords** — AWS IAM authentication with auto-regenerated tokens (no hardcoded credentials)
4. **Parameterized Queries** — All database operations use parameterized queries to prevent SQL injection
5. **Graceful Degradation** — The app works fine without a database (uses client-side state); database is optional

### Database Schema

#### `career_graphs` Table

Stores complete career profiles:

```sql
CREATE TABLE career_graphs (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,        -- Graph identifier (e.g., "senior-engineer-2024")
  profile_name VARCHAR(255) NOT NULL,       -- User's full name
  headline VARCHAR(255) NOT NULL,           -- Job title / headline
  contact JSONB NOT NULL,                   -- { email, phone, location, website, github, linkedin }
  experiences JSONB NOT NULL,               -- [ { role, company, location, period, description, metrics, bullets } ]
  skills JSONB NOT NULL,                    -- [ { name, category, years } ]
  projects JSONB NOT NULL,                  -- [ { name, description, techStack, link, highlight, bullets } ]
  education JSONB NOT NULL,                 -- [ { institution, degree, period, location } ]
  certifications JSONB NOT NULL,            -- [ { name, issuer, link } ]
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### `alignments` Table (Optional)

For tracking job alignment analyses:

```sql
CREATE TABLE alignments (
  id BIGSERIAL PRIMARY KEY,
  graph_id BIGINT NOT NULL REFERENCES career_graphs(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,            -- The job posting text analyzed
  score DECIMAL(5, 2),                      -- Alignment score (0-100)
  matched_skills JSONB,                     -- Skills found in both graph and JD
  partial_skills JSONB,                     -- Related/partial matches
  skill_gaps JSONB,                         -- Skills missing from the graph
  generated_resume JSONB,                   -- The tailored resume that was generated
  created_at TIMESTAMP WITH TIME ZONE
);
```

## Setup

### Prerequisites

- Vercel project with AWS integration capability
- AWS account with IAM role for the project
- PostgreSQL client tools (optional, for manual queries)

### Step 1: Add the AWS Aurora PostgreSQL Integration

1. Go to your **Vercel Project Settings**
2. Navigate to **Integrations** or **Storage**
3. Search for **Amazon Aurora PostgreSQL** and connect it
4. Follow the prompts to create or link an Aurora cluster
5. Vercel will automatically populate environment variables:
   - `PGHOST` — Cluster endpoint
   - `PGDATABASE` — Database name (default: `postgres`)
   - `PGUSER` — Database user (default: `postgres`)
   - `AWS_REGION` — AWS region
   - `AWS_ROLE_ARN` — IAM role for token-based auth

### Step 2: Initialize the Database Schema

Once the integration is connected and environment variables are set:

```bash
# Run the schema setup script
psql -h $PGHOST -U postgres -d postgres -f scripts/001-setup-career-graph-schema.sql
```

Or use the AWS RDS console to run the SQL directly.

### Step 3: Verify Connection

Test the connection with a simple query:

```bash
psql -h $PGHOST -U postgres -d postgres -c "SELECT version();"
```

If successful, you'll see the PostgreSQL version.

## API Routes

All routes are available at `/api/career-graphs/*` and use parameterized queries.

### POST `/api/career-graphs/save`

Save or update a career graph (upsert by name).

**Request:**
```json
{
  "name": "senior-fullstack-2024",
  "graph": {
    "profileName": "Alex Rivera",
    "headline": "Senior Full-Stack Engineer",
    "contact": { ... },
    "experiences": [ ... ],
    "skills": [ ... ],
    "projects": [ ... ],
    "education": [ ... ],
    "certifications": [ ... ]
  }
}
```

**Response (200 OK):**
```json
{
  "id": 42,
  "name": "senior-fullstack-2024",
  "created_at": "2024-06-26T12:00:00Z",
  "updated_at": "2024-06-26T12:00:00Z"
}
```

### GET `/api/career-graphs/load?name=senior-fullstack-2024`

Retrieve a saved career graph by name.

**Response (200 OK):**
```json
{
  "id": 42,
  "graph": { /* full CareerGraph object */ },
  "created_at": "2024-06-26T12:00:00Z",
  "updated_at": "2024-06-26T12:00:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Graph not found"
}
```

### GET `/api/career-graphs/list`

List all saved career graphs (names and metadata only, not full data).

**Response (200 OK):**
```json
{
  "graphs": [
    {
      "id": 42,
      "name": "senior-fullstack-2024",
      "profile_name": "Alex Rivera",
      "headline": "Senior Full-Stack Engineer",
      "created_at": "2024-06-26T12:00:00Z",
      "updated_at": "2024-06-26T12:00:00Z"
    },
    {
      "id": 43,
      "name": "devops-engineer-2024",
      "profile_name": "Jordan Smith",
      "headline": "DevOps Engineer",
      "created_at": "2024-06-25T10:00:00Z",
      "updated_at": "2024-06-25T10:00:00Z"
    }
  ]
}
```

### DELETE `/api/career-graphs/delete?name=senior-fullstack-2024`

Delete a saved career graph by name.

**Response (200 OK):**
```json
{
  "success": true,
  "deleted_id": 42
}
```

**Response (404 Not Found):**
```json
{
  "error": "Graph not found"
}
```

## Client-Side Usage

Use the `useCareerDb()` hook in any React component:

```typescript
import { useCareerDb } from "@/lib/use-career-db"

export function CareerGraphManager() {
  const db = useCareerDb()

  // Save a graph
  const handleSave = async () => {
    const result = await db.save("my-profile", careerGraphData)
    if (result) {
      console.log(`Saved graph: ${result.name}`)
    } else {
      console.error("Save failed:", db.error)
    }
  }

  // Load a graph
  const handleLoad = async () => {
    const data = await db.load("my-profile")
    if (data) {
      console.log("Loaded graph:", data.graph)
      setGraph(data.graph)
    }
  }

  // List all graphs
  const handleList = async () => {
    const graphs = await db.list()
    console.log("Saved graphs:", graphs)
  }

  // Delete a graph
  const handleDelete = async () => {
    const success = await db.delete("my-profile")
    if (success) console.log("Deleted graph")
  }

  return (
    <>
      <button onClick={handleSave} disabled={db.isSaving}>
        {db.isSaving ? "Saving..." : "Save Graph"}
      </button>
      <button onClick={handleLoad} disabled={db.isLoading}>
        {db.isLoading ? "Loading..." : "Load Graph"}
      </button>
      {db.error && <p style={{ color: "red" }}>{db.error}</p>}
    </>
  )
}
```

### Hook API

```typescript
const db = useCareerDb()

// Methods
await db.save(name: string, graph: CareerGraph): Promise<SavedGraph | null>
await db.load(name: string): Promise<GraphMetadata | null>
await db.list(): Promise<SavedGraph[]>
await db.delete(name: string): Promise<boolean>

// State
db.isSaving: boolean
db.isLoading: boolean
db.error: string | null
```

## Error Handling

The API routes return appropriate HTTP status codes:

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Graph saved/loaded |
| 400 | Bad request | Missing required fields |
| 404 | Not found | Graph name doesn't exist |
| 500 | Server error | Database connection failed |

On the client side, `useCareerDb()` automatically captures errors in the `error` state and logs them to the console.

## Troubleshooting

### "Database is not configured"

**Cause**: Environment variables (`PGHOST`, `AWS_REGION`, etc.) are not set.

**Solution**:
1. Ensure the AWS Aurora PostgreSQL integration is connected in Vercel Settings
2. Verify environment variables are available: check `.env.local` or Vercel project settings
3. Restart the dev server

### Connection Timeouts

**Cause**: Database is unreachable or network issues.

**Solution**:
1. Check the Aurora cluster status in AWS RDS console
2. Verify security group rules allow connections from Vercel's IP range
3. Test the connection manually: `psql -h $PGHOST -U postgres -d postgres -c "SELECT 1;"`

### "Table does not exist"

**Cause**: Schema setup script was not run.

**Solution**: Run the schema script:
```bash
psql -h $PGHOST -U postgres -d postgres -f scripts/001-setup-career-graph-schema.sql
```

### Slow Queries

**Optimization**:
1. Ensure indexes were created: `CREATE INDEX idx_career_graphs_name ON career_graphs(name);`
2. Use `ANALYZE` to update table statistics
3. Monitor CloudWatch metrics in AWS console

## Future Enhancements

- **pgvector Integration** — Enable semantic search using ML embeddings
- **Read Replicas** — Distribute read load across multiple replicas
- **Backup & Recovery** — Automated snapshots and point-in-time recovery
- **Audit Trail** — Track all changes to career graphs (timestamps + user context)
- **Full-Text Search** — Index experiences and project descriptions for search

## References

- [AWS Aurora PostgreSQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraPostgreSQL.html)
- [Vercel Database Integration Guide](https://vercel.com/docs/storage)
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
