# Semantic Career Alignment Engine — Features

## Hybrid Semantic Architecture

### Vector Engine (Phase 1 — The "Brain")
- **Embedding Generation**: Profile skills and JD requirements are converted to 768-dim vectors via Gemini Embedding (`gemini-embedding-2`)
- **Mathematical Cosine Similarity**: Supabase pgvector computes real cosine distance — no LLM guessing
- **Objective Scoring**: Each skill gets a precise similarity score (0.0–1.0), classified as Matched (≥0.75), Partial (≥0.60), or Gap (<0.60)
- **Pipeline Badge**: UI clearly indicates whether results came from the Vector Engine or local fallback

### GenAI Engine (Phase 2 — The "Writer")
- **Math-Backed Generation**: Only the mathematically proven gaps and matches are passed to Gemini Flash
- **ATS-Optimized Bullets**: 6–10 resume bullet points rewritten with action verbs, metrics, and JD keywords
- **Grounded Output**: The LLM writes based on objective vector similarity, not hallucination

### Deterministic Fallback
- When Supabase isn't configured, the engine uses a local token-overlap + synonym table matcher
- Same UI, same workflow — just without pgvector math

## Resume Export & LaTeX Integration

### PDF Export
- **True LaTeX Compilation**: Server-side compilation via texlive.net for pixel-perfect professional PDFs
- **ATS-Ready Format**: Latin Modern serif font, compact single-page layout
- **JD-Matched Highlights**: Tailored bullets emphasized in royal blue with `[JD MATCH]` labels
- **Fallback**: jsPDF generates an in-browser PDF if the LaTeX service is unavailable

### LaTeX Export
- **Editable `.tex` File**: Download and customize locally
- **Custom Macros**: Navy blue small-caps headings, precise spacing, categorized skill groups
- **Compile locally**: `pdflatex resume.tex`

## Dual-Storage Framework

### Local Storage
- Works offline, no setup required
- 1-day expiry to keep data fresh
- Toggle from the Career Graph page

### Supabase Cloud
- Persists career profiles with vector embeddings
- Powers the Vector Engine for real similarity search
- Anonymous access via RLS policies (hackathon mode)

## Data Management
- **Export to JSON**: Download your career graph as a portable JSON file
- **Import from JSON**: Re-import on any machine with structural validation
- **Storage Toggle**: Switch between Local and Cloud from the Career Graph page

## Alignment Dashboard UI
- **Score Ring**: Animated SVG ring showing alignment percentage (0–100)
- **Pipeline Badge**: Green for Vector Engine, amber for Local Matching
- **Cosine Similarity Breakdown**: Animated progress bars per JD requirement
- **Skill Pills**: Color-coded chips showing match status + similarity percentage for all statuses
- **Gap Analysis**: Highlighted section with specific skills to add or strengthen
