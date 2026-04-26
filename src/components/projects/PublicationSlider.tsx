"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Publication } from "@/lib/projects";
import { PublicationCard } from "./ProjectCard";

export function PublicationSlider({ publications }: { publications: Publication[] }) {
  const [page, setPage] = useState(0);

  const PER_PAGE = 3;
  const totalPages = Math.ceil(publications.length / PER_PAGE);
  const current = publications.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    background: "none",
    border: "1px solid var(--border)",
    color: disabled ? "var(--border)" : "var(--muted)",
    padding: "8px",
    cursor: disabled ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "90%",
        maxWidth: 800,
        margin: "0 auto",
        height: "100%",
        padding: "40px 0",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          color: "var(--muted)",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        PUBLICATIONS
      </div>
      <div style={{ height: 1, background: "var(--border)", marginBottom: 32 }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flex: 1 }}>
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          style={btnStyle(page === 0)}
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {current.map((pub) => (
            <PublicationCard key={pub.title} pub={pub} />
          ))}
        </div>

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          style={btnStyle(page === totalPages - 1)}
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div
        style={{
          marginTop: 24,
          textAlign: "center",
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--muted)",
          textTransform: "uppercase",
        }}
      >
        {page + 1} / {totalPages}
      </div>
    </div>
  );
}
