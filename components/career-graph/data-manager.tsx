"use client";

import { useRef, type ChangeEvent } from "react";
import type { CareerGraph } from "@/lib/types";
import { Download, Upload } from "lucide-react";

interface DataManagerProps {
  /** The current career graph state to export. */
  graph: CareerGraph;
  /** Callback to update the app state after a successful import. */
  onImport: (graph: CareerGraph) => void;
}

/**
 * Validates that a parsed JSON object conforms to the CareerGraph shape.
 * Performs structural checks — not deep schema validation — sufficient for
 * catching accidental file uploads while remaining lightweight.
 */
function isValidCareerGraph(data: unknown): data is CareerGraph {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;

  // Required top-level string fields
  if (typeof obj.profileName !== "string") return false;
  if (typeof obj.headline !== "string") return false;

  // Contact must be an object
  if (typeof obj.contact !== "object" || obj.contact === null) return false;

  // Arrays must be present (can be empty)
  if (!Array.isArray(obj.experiences)) return false;
  if (!Array.isArray(obj.skills)) return false;
  if (!Array.isArray(obj.projects)) return false;
  if (!Array.isArray(obj.education)) return false;
  if (!Array.isArray(obj.certifications)) return false;

  return true;
}

/**
 * Export the career graph JSON as a downloadable file.
 */
function exportData(graph: CareerGraph): void {
  const json = JSON.stringify(graph, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "career-graph.json";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * DataManager — Import / Export buttons for the career graph.
 *
 * - **Export to JSON**: serializes the current graph state and triggers
 *   a `career-graph.json` download.
 * - **Import from JSON**: opens a file picker, validates the JSON
 *   structure, and calls `onImport` with the parsed `CareerGraph`.
 */
export function DataManager({ graph, onImport }: DataManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);

      if (!isValidCareerGraph(parsed)) {
        alert(
          "Invalid career graph file. The JSON must contain profileName, headline, contact, experiences, skills, projects, education, and certifications."
        );
        return;
      }

      onImport(parsed);
    } catch {
      alert("Failed to parse the file. Please ensure it is valid JSON.");
    } finally {
      // Reset the input so the same file can be re-imported if needed.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Import career graph JSON file"
      />

      {/* Export button */}
      <button
        type="button"
        onClick={() => exportData(graph)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:border-accent/40 hover:shadow-md active:scale-[0.98]"
        title="Download your career graph as JSON"
      >
        <Download className="h-4 w-4 text-accent" aria-hidden="true" />
        Export to JSON
      </button>

      {/* Import button */}
      <button
        type="button"
        onClick={handleImportClick}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:border-accent/40 hover:shadow-md active:scale-[0.98]"
        title="Upload a career graph JSON file"
      >
        <Upload className="h-4 w-4 text-accent" aria-hidden="true" />
        Import from JSON
      </button>
    </div>
  );
}
