# Semantic Career Alignment Engine - Features

## Resume Export & LaTeX Integration

The Alignment Studio now supports professional resume export in multiple formats:

### PDF Export
- **One-Click PDF Generation**: Click the **PDF** button in the resume header to instantly download your optimized resume as a single-page PDF file.
- **ATS-Ready Format**: Uses professional typography (Fira Code monospace font) and single-page layout optimized for Applicant Tracking Systems.
- **Visual Highlights**: JD-matched bullet points are highlighted in blue with `[JD MATCH]` labels for easy scanning.

### LaTeX Export
- **Editable LaTeX Format**: Click the **LaTeX** button to download a professional ATS-optimized LaTeX resume template (`resume.tex`).
- **LaTeX Template Structure**: Based on the provided ATS-Optimized Resume Template with:
  - Professional color scheme (custom blue theme)
  - Proper spacing and margins for single-page display
  - Dynamic content population from your career graph
  - ATS-parsable PDF generation via `pdflatex`
- **Customizable**: Edit the `.tex` file directly to:
  - Add custom contact information (email, phone, LinkedIn, GitHub, website)
  - Adjust colors and styling
  - Fine-tune spacing and layout
  - Compile locally with `pdflatex resume.tex`

### Typography
- **Programming Font**: All text uses **Fira Code** monospace font for a clean, technical aesthetic that complements developer/engineer roles.
- **Consistent Styling**: Both web and PDF exports maintain the same professional typography and layout.

## Resume Content Generation

### Intelligent Tailoring
- **Job Description Alignment**: The engine analyzes the pasted job description and:
  - Ranks your skills by relevance to the role
  - Reorders your experience bullets to prioritize JD-matching achievements
  - Flags experience that directly aligns with role requirements
  
### Single-Page Optimization
- **Space Efficiency**: All generated resumes are designed to fit on a single page, meeting ATS requirements and recruiter preferences.
- **Core Skills Highlighting**: Top 4 skills are emphasized; technical skills are categorized for clarity.

## Download Workflow

1. **Paste Job Description** → Analyze & Align
2. **View Optimized Resume** with real-time alignment visualization
3. **Choose Download Format**:
   - **PDF**: Download immediately for email/ATS submission
   - **LaTeX**: Download `.tex` file for local compilation and full customization

### Example LaTeX Workflow
```bash
# Download resume.tex from the app
# Edit contact info and customize styling locally
nano resume.tex

# Compile to PDF
pdflatex resume.tex

# View result
open resume.pdf
```

## Technical Implementation

### Dependencies
- **jspdf** & **html2canvas**: PDF generation from HTML
- **Fira Code Font**: Google Fonts integration for typography
- **LaTeX Generator** (`lib/latex-generator.ts`):
  - `generateLatexResume()`: Converts alignment result to LaTeX
  - `downloadLatex()`: Triggers browser download of `.tex` file
  - `generatePdfFromHtml()`: Client-side PDF rendering

### Component Structure
- `ResumePanel`: Main resume display with export buttons
- `PrintableResume`: Optimized single-page print layout
- Export handlers for both PDF and LaTeX formats

## Future Enhancements

- Compile LaTeX directly in browser using WebAssembly
- Multiple resume template variations (chronological, functional, hybrid)
- Interactive LaTeX editor with live preview
- ATS compatibility scoring for downloaded files
- Integration with pgvector for semantic resume enhancement
