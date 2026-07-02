# Semantic Career Alignment Engine

A Next.js application that compares your career graph against any Job Description using a **Hybrid Semantic Architecture** — combining Supabase pgvector cosine similarity (the "Vector Engine") with Google Gemini LLM generation (the "GenAI Engine") — to produce ATS-optimized LaTeX resumes.

Built for an AI Hackathon.

---

## How It Works

### The Hybrid Semantic Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    Job Description                        │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │   Gemini Flash LLM     │
          │  (Extract JD Skills)   │
          └────────────┬───────────┘
                       │
              JD Requirements[]
                       │
         ┌─────────────┴──────────────┐
         ▼                            ▼
┌─────────────────┐          ┌─────────────────┐
│ Gemini Embedding │          │ Gemini Embedding │
│ (JD Skills)      │          │ (Profile Skills) │
└────────┬────────┘          └────────┬────────┘
         │                            │
         └──────────┬─────────────────┘
                    ▼
       ┌────────────────────────┐
       │   Supabase pgvector    │
       │  Cosine Similarity     │  ← PHASE 1: Vector Engine
       │  (Mathematical Proof)  │
       └────────────┬───────────┘
                    │
          matched / partial / gaps
          (with real similarity %)
                    │
                    ▼
       ┌────────────────────────┐
       │   Gemini Flash LLM     │
       │  (ATS Resume Writer)   │  ← PHASE 2: GenAI Engine
       └────────────┬───────────┘
                    │
                    ▼
       ┌────────────────────────┐
       │  Tailored Resume PDF   │
       │  (LaTeX compiled)      │
       └────────────────────────┘
```

**Phase 1 — Vector Engine (The "Brain"):**
Your profile skills and the JD requirements are converted into 768-dimensional vector embeddings using Gemini Embedding. Supabase pgvector then computes the **cosine similarity** mathematically — no LLM guessing. Each skill gets an objective score (0.0–1.0) and is classified as **Matched** (≥0.75), **Partial** (≥0.60), or **Gap** (<0.60).

**Phase 2 — GenAI Engine (The "Writer"):**
Only the mathematically proven insights (exact gaps and matches) are passed to Gemini. The LLM acts purely as a resume writer — rewriting your bullets to bridge gaps and emphasize matches, grounded in math rather than hallucination.

### Dual-Storage Framework

- **Local Storage**: Works offline with 1-day expiry. No setup required.
- **Supabase Cloud**: Persists career profiles with embeddings in PostgreSQL + pgvector.

Users toggle between modes from the Career Graph page.

---

## Features

- ✅ **Vector Engine** — Real cosine similarity via Supabase pgvector (not LLM-guessed scores)
- ✅ **GenAI Writer** — Gemini rewrites resume bullets using only math-backed insights
- ✅ **LaTeX PDF** — Server-side compilation via TeX Live for pixel-perfect resumes
- ✅ **Fallback PDF** — jsPDF in-browser when LaTeX service is unavailable
- ✅ **Pipeline Badge** — UI shows whether Vector Engine or local matching was used
- ✅ **Similarity Breakdown** — Visual cosine similarity bars for every JD requirement
- ✅ **Import/Export** — Download career graph as JSON; re-import on any machine
- ✅ **Dual Storage** — Local (offline) or Supabase Cloud with toggle
- ✅ **Responsive UI** — Mobile-friendly, dark-themed with Tailwind CSS 4

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Database | Supabase (PostgreSQL + pgvector) |
| AI Embeddings | Google Gemini Embedding (`gemini-embedding-2`) |
| AI Generation | Google Gemini Flash (structured JSON output) |
| PDF | LaTeX (texlive.net server-side) + jsPDF fallback |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- **Gemini API Key** — [Get one here](https://aistudio.google.com/apikey)
- **Supabase Project** (optional, for Vector Engine) — [Create free project](https://supabase.com)

### 1. Clone & Install

```bash
git clone https://github.com/Vedant224/Semantic-Career-Alignment-Engine.git
cd Semantic-Career-Alignment-Engine
npm install
```

### 2. Configure Environment

Create `.env.local` in the project root:

```bash
# ─── Google Gemini API Key ───────────────────────────────────────────────────
# Powers both embeddings and LLM generation (one key for everything).
GEMINI_API_KEY=your_gemini_api_key_here

# ─── Supabase (Optional — enables Vector Engine) ────────────────────────────
# Get from: Supabase Dashboard > Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Set Up Supabase (Optional)

If you want the Vector Engine (real cosine similarity), run the setup script in **Supabase SQL Editor** (Dashboard → SQL Editor → New query):

```sql
-- Copy and paste the contents of scripts/001-supabase-setup.sql
```

This creates:
- `career_profiles` table with pgvector `embedding` column
- `match_career_profiles` function for profile similarity search
- `get_max_similarities` function for JD-vs-Skills vector math
- HNSW index for fast approximate nearest-neighbor search
- RLS policies for anonymous access

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
├── app/
│   ├── page.tsx                          # Homepage — alignment dashboard
│   ├── layout.tsx                        # Root layout with metadata
│   ├── globals.css                       # Design tokens & theme
│   ├── actions.ts                        # Server actions
│   ├── career-graph/
│   │   └── page.tsx                      # Career graph editor page
│   └── api/
│       ├── align/route.ts                # Hybrid alignment pipeline
│       ├── embed/route.ts                # Embedding generation endpoint
│       └── compile-latex/route.ts        # LaTeX → PDF compilation proxy
├── components/
│   ├── app-shell.tsx                     # Navigation shell
│   ├── career-graph/
│   │   ├── career-graph-form.tsx         # Full career data editor
│   │   └── data-manager.tsx              # Import/export JSON
│   └── dashboard/
│       ├── alignment-dashboard.tsx       # JD input + results orchestrator
│       ├── alignment-summary.tsx         # Score ring + pipeline badge + breakdown
│       ├── skill-pill.tsx                # Color-coded skill chips with %
│       ├── resume-panel.tsx              # Resume preview + PDF/LaTeX export
│       └── resume-editor.tsx             # Inline resume editing
├── lib/
│   ├── types.ts                          # TypeScript domain types
│   ├── matching.ts                       # Local deterministic fallback matcher
│   ├── career-store.ts                   # Seed/demo career graph data
│   ├── supabase.ts                       # Supabase client singleton
│   ├── use-career-data.ts               # Dual-storage hook (local + cloud)
│   ├── latex-generator.ts                # LaTeX template & PDF generation
│   └── utils.ts                          # cn() utility
├── scripts/
│   └── 001-supabase-setup.sql            # Complete Supabase schema + functions
└── package.json
```

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/align` | Full hybrid alignment pipeline (Vector Engine → GenAI Writer) |
| POST | `/api/embed` | Generate embeddings via Gemini Embedding |
| POST | `/api/compile-latex` | Compile LaTeX source into PDF via TeX Live |

---

## Workflow

1. **Build your Career Graph** → `/career-graph` — Add skills, experience, projects, education, certifications
2. **Save** → Local storage (instant) or Supabase Cloud (with embedding generation)
3. **Paste a Job Description** → Homepage alignment dashboard
4. **Analyze & Align** →
   - Vector Engine extracts JD requirements, generates embeddings, computes cosine similarity via pgvector
   - GenAI Engine rewrites resume bullets using the math-backed insights
5. **View Results** →
   - Score ring (0–100) with match/partial/gap counts
   - Pipeline badge (Vector Engine or Local Matching)
   - Cosine similarity breakdown bars per requirement
   - Tailored resume with JD-matched bullets
6. **Export** → Download LaTeX-compiled PDF or raw `.tex` file

---

## Troubleshooting

### "Powered by Local Matching" instead of Vector Engine
- Supabase environment variables are not set in `.env.local`
- Or the `get_max_similarities` function hasn't been created — run `scripts/001-supabase-setup.sql`

### Embedding model 404 error
- The app tries `gemini-embedding-2` then `gemini-embedding-001`. Make sure your Gemini API key has access to at least one of these models.

### LaTeX compile failed
- texlive.net may be temporarily down. The app automatically falls back to jsPDF for in-browser PDF generation.

### PDF not displaying
- Check browser console for CORS errors. Ensure JavaScript is enabled and pop-ups aren't blocked.

---

## Author

**Vedant Hande** — Built for the AI Hackathon.

---

## License

MIT
