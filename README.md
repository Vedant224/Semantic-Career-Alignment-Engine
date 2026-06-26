# Semantic Career Alignment Engine

A modern web application that aligns your personal career profile against target job descriptions, generating tailored resumes and identifying semantic skill gaps.

## Project Overview

### What It Does

The Semantic Career Alignment Engine helps professionals:

1. **Build a Master Career Graph** — Centralize all your professional information: work experience, technical skills (organized by category), projects, education, certifications, and contact details.

2. **Align to Any Role** — Paste a target job description and the engine performs semantic matching:
   - Extracts required skills and qualifications from the JD
   - Compares them against your career graph
   - Generates a **tailored resume** with relevant experience emphasized
   - Surfaces **skill gaps** to help you understand what to learn or highlight

3. **Export Professional Resumes** — Downloads a real LaTeX-compiled PDF resume (or falls back to a built-in generator) that mirrors your template exactly.

### Input & Output

**Input:**
- Your **Career Graph**: Profile name, headline, contact info, experience (role, company, location, description, metrics), skills (categorized), projects, education, certifications
- A **Target Job Description**: Any job posting text (copy/paste from LinkedIn, Indeed, company website, etc.)

**Output:**
- **Alignment Score** (0–100): How well your profile matches the target role
- **Skill Analysis**: Matched skills (green), partial matches (yellow), and gaps (red)
- **Tailored Resume PDF**: A formatted resume with JD-relevant experience emphasized, ready to download
- **Metrics & Metadata**: Job skills extracted, gap analysis for skill development

### Example Workflow

1. Fill in your career graph (edit button on homepage)
2. Paste a job description (e.g., "Senior Full-Stack Engineer at TechCorp — TypeScript, React, PostgreSQL, AWS, CI/CD...")
3. Click "Analyze & align"
4. View the alignment score and skill gaps in the left panel
5. See your tailored resume (true LaTeX PDF) in the right panel
6. Download the PDF or edit your career graph to improve alignment

## Tech Stack

### Frontend
- **Next.js 16** (App Router): React framework with server-side rendering and API routes
- **React 19.2**: Modern UI component library with server components
- **Tailwind CSS 4**: Utility-first CSS framework for responsive design
- **TypeScript**: Static type safety across the full stack
- **Lucide React**: Icon library for UI elements

### PDF Generation
- **LaTeX Compilation** (Server-side via texlive.net)
  - The engine generates a full `.tex` document from your career data
  - Sends it to a remote TeX Live service for **true PDF compilation** using pdflatex
  - Returns a professional Latin Modern serif PDF with exact spacing and formatting
  - **Fallback**: jsPDF (in-browser) generates a Times serif PDF if the LaTeX service is unavailable
- **jsPDF**: Lightweight client-side PDF generation library
- **html2canvas**: Screenshot-to-image utility (optional, for future preview features)

### API & Backend
- **Next.js API Routes**: 
  - `/api/compile-latex`: Server-side proxy to the LaTeX compiler
  - `/api/career-graphs/save`: Persist career graphs to the database
  - `/api/career-graphs/load`: Retrieve saved career graphs
  - `/api/career-graphs/list`: List all saved graphs
  - `/api/career-graphs/delete`: Delete a graph
- **AWS Aurora PostgreSQL**: For persisting career graphs with JSONB storage
- **AWS RDS IAM Signer**: For secure, token-based database connections

### Utilities & Styling
- **Class Variance Authority**: CSS class composition for complex component variants
- **clsx/tailwind-merge**: Utility for merging Tailwind classes safely

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** (or yarn/pnpm)
- **Git** (to clone the repository)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vedant224/Semantic-Career-Alignment-Engine.git
   cd Semantic-Career-Alignment-Engine
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional, if using the database):
   Create a `.env.local` file in the project root:
   ```bash
   # AWS Aurora PostgreSQL with IAM authentication
   PGHOST=your-aurora-cluster.xxxx.us-east-1.rds.amazonaws.com
   PGDATABASE=postgres
   PGUSER=postgres
   AWS_REGION=us-east-1
   AWS_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/vercel-project-role
   ```
   
4. **Set up the database schema** (one-time, after connecting the Aurora PostgreSQL integration):
   ```bash
   # Connect to your Aurora PostgreSQL cluster and run the schema script
   psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f scripts/001-setup-career-graph-schema.sql
   ```
   This creates the `career_graphs` and `alignments` tables with proper indexes.

### Running Locally

**Development server:**
```bash
npm run dev
```
The app opens at [http://localhost:3000](http://localhost:3000)

**Build for production:**
```bash
npm run build
npm start
```

**Linting & formatting:**
```bash
npm run lint
```

## How LaTeX-to-PDF Conversion Works

### The Workflow

1. **Career Data → LaTeX Generation**
   - Your career graph (experience, skills, projects, education, certifications) is transformed into a LaTeX `.tex` file
   - Located in `/lib/latex-generator.ts`, the generator builds a structured `.tex` document using custom LaTeX macros
   - Includes: name header with contact info, categorized skill groups, professional experience with emphasized bullets, projects, education, and certifications

2. **Server-Side Compilation via texlive.net**
   - The generated `.tex` is sent to `/api/compile-latex` (Next.js API route)
   - The route proxies the request to **texlive.net** (https://texlive.net/cgi-bin/latexcgi), a free public TeX Live service
   - texlive.net runs **pdflatex** (full TeX Live suite) to compile the `.tex` → PDF
   - Returns a true LaTeX PDF with Latin Modern serif font, exact spacing, and professional formatting

3. **Fallback to jsPDF**
   - If texlive.net is unavailable (network error, service down), the client catches the error
   - Falls back to jsPDF to generate a Times serif PDF in-browser
   - Both paths produce high-quality PDFs; LaTeX is preferred for pixel-perfect formatting

### LaTeX Template Features

- **Custom macros** for consistent spacing and formatting (sections, bullets, lists)
- **Navy blue small-caps** headings with precise line heights and breaks
- **Categorized skill groups** (Languages, Frontend, Backend, Databases, DevOps & Tools, Core Skills)
- **JD-matched bullets** (emphasized in royal blue) to highlight relevant experience
- **Contact line** with email, phone, location, website, GitHub, and LinkedIn links
- **Multi-section support**: experience, projects, education, certifications
- **Compact spacing** to fit a professional one-page resume

### Key Files

- `/lib/latex-generator.ts` — LaTeX template and PDF generation logic
- `/app/api/compile-latex/route.ts` — Server-side TeX Live proxy
- `/lib/types.ts` — Data structures (CareerGraph, Experience, Skill, etc.)
- `/lib/matching.ts` — Semantic matching and resume building logic

## Project Structure

```
├── app/
│   ├── page.tsx                          # Homepage with alignment dashboard
│   ├── career-graph/
│   │   └── page.tsx                      # Career graph editor
│   ├── api/
│   │   └── compile-latex/
│   │       └── route.ts                  # LaTeX compilation endpoint
│   └── layout.tsx                        # Root layout with metadata
├── components/
│   ├── dashboard/
│   │   ├── alignment-dashboard.tsx       # Main alignment UI
│   │   ├── resume-panel.tsx              # Resume preview & PDF viewer
│   │   └── skill-gap-panel.tsx           # Skill analysis display
│   └── career-graph/
│       └── career-graph-form.tsx         # Career data editor form
├── lib/
│   ├── types.ts                          # TypeScript domain types
│   ├── matching.ts                       # Semantic matching & scoring
│   ├── career-store.ts                   # Seed/default career graph
│   ├── latex-generator.ts                # LaTeX → PDF logic
│   └── db.ts                             # Database utilities (future)
├── public/                               # Static assets
├── package.json                          # Dependencies & scripts
└── tailwind.config.ts                    # Tailwind CSS configuration
```

## Key Features

- ✅ **Semantic Skill Matching** — Deterministic token-overlap + synonym table matching (ready to swap in pgvector cosine similarity)
- ✅ **Real LaTeX Compilation** — Pixel-perfect PDF via TeX Live (texlive.net service)
- ✅ **Fallback PDF Generator** — jsPDF for offline or service-unavailable scenarios
- ✅ **Responsive Design** — Mobile-friendly UI with Tailwind CSS
- ✅ **Structured Career Data** — Organized skills, experience, projects, education, certifications
- ✅ **Contact & Links** — Email, phone, location, website, GitHub, LinkedIn in resume header
- ✅ **Emphasis Highlighting** — Job-description-matched bullets rendered in royal blue with badge
- ✅ **Clean PDF Display** — Embedded iframe viewer with no browser toolbars

## Development Notes

### Architecture Highlights

1. **Server-side LaTeX compilation** avoids multi-MB WASM bundles and ensures consistent output
2. **Semantic matching** uses a deterministic rule-based system (refactor-ready for ML embeddings)
3. **Career graph** stored in-memory/client-side (future: persisted to PostgreSQL)
4. **Tailwind CSS 4** for modern, utility-first styling with no CSS bloat

### Future Enhancements

- [x] **AWS Aurora PostgreSQL** persistence for career graphs (API routes + schema implemented)
- [ ] ML embeddings (pgvector) for semantic similarity instead of token matching
- [ ] AI-powered professional summary generation per role
- [ ] Multi-page resume support with section reordering
- [ ] ATSF (Applicant Tracking System) optimized export modes
- [ ] Skill recommendation engine based on job market trends
- [ ] User authentication (multi-user support)

## Database Integration (AWS Aurora PostgreSQL)

### Overview

The app includes AWS Aurora PostgreSQL integration for persisting career graphs. This allows users to save, load, and manage multiple career profiles.

### Architecture

- **Schema**: JSONB-based storage (single table `career_graphs`) with flexible nested data for experiences, skills, projects, education, and certifications
- **Client Hook**: `useCareerDb()` in `lib/use-career-db.ts` provides a simple, type-safe interface for database operations
- **API Routes**: Four endpoints handle save/load/list/delete with parameterized queries (SQL injection safe)
- **Authentication**: AWS RDS IAM token-based authentication (no passwords stored, tokens auto-regenerated per connection)

### Setup

1. **Connect the AWS Aurora PostgreSQL integration** in your Vercel project settings
2. **Configure environment variables**:
   ```bash
   PGHOST=your-aurora-cluster.xxxx.us-east-1.rds.amazonaws.com
   PGDATABASE=postgres
   PGUSER=postgres
   AWS_REGION=us-east-1
   AWS_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/vercel-project-role
   ```
3. **Run the schema script**:
   ```bash
   psql -h $PGHOST -U postgres -d postgres -f scripts/001-setup-career-graph-schema.sql
   ```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/career-graphs/save` | Save/update a career graph (upsert by name) |
| GET | `/api/career-graphs/load?name=xyz` | Load a saved graph by name |
| GET | `/api/career-graphs/list` | List all saved career graphs |
| DELETE | `/api/career-graphs/delete?name=xyz` | Delete a graph by name |

### Usage Example

```typescript
import { useCareerDb } from "@/lib/use-career-db"

export function MyComponent() {
  const db = useCareerDb()
  
  const handleSave = async () => {
    const result = await db.save("senior-engineer", careerGraphData)
    if (result) console.log("Saved as:", result.name)
  }
  
  const handleLoad = async () => {
    const data = await db.load("senior-engineer")
    if (data) console.log("Loaded from", data.created_at)
  }
  
  const allGraphs = await db.list()
  // [{ id, name, profile_name, headline, created_at, updated_at }, ...]
}
```

## Environment Variables

For local development without a database, no environment variables are required. To enable database persistence:

```bash
# AWS Aurora PostgreSQL with IAM auth
PGHOST=your-aurora-cluster.xxxx.us-east-1.rds.amazonaws.com
PGDATABASE=postgres
PGUSER=postgres
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/vercel-project-role
```

## Troubleshooting

### "LaTeX compile failed" Error

- **Cause**: texlive.net service is temporarily down or the generated `.tex` has syntax errors
- **Solution**: The app automatically falls back to jsPDF. Check the browser console for error details

### PDF Not Displaying

- **Cause**: Browser security policy or blocked pop-ups
- **Solution**: Check the browser console for CORS errors; ensure JavaScript is enabled

### Styling Issues

- **Cause**: Tailwind CSS not recompiled
- **Solution**: Restart the dev server (`npm run dev`)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

## License

MIT License (or specify your preferred license)

## Author

**Vedant Hande** — Built for modern career alignment and resume optimization.

---

**Questions or feedback?** Open an issue on GitHub or reach out via the contact links in your resume!
