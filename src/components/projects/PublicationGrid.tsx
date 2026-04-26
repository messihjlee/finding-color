"use client";

import { useState } from "react";
import { ExternalLink, FileText, X } from "lucide-react";
import type { Publication } from "@/lib/projects";

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function PubCard({
  pub,
  onClick,
}: {
  pub: Publication;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "flex-start",
        width: "100%",
        height: "100%",
        padding: "14px",
        border: "1px solid var(--border)",
        background: "var(--card)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
      }}
    >
      <p
        style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--foreground)",
          margin: "0 0 8px",
        }}
      >
        {truncate(pub.title, 120)}
      </p>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted)",
          flexShrink: 0,
        }}
      >
        {pub.venue} · {pub.year}
      </div>
    </button>
  );
}

function PubModal({
  pub,
  onClose,
}: {
  pub: Publication;
  onClose: () => void;
}) {
  const doiUrl = pub.doi ? `https://doi.org/${pub.doi}` : undefined;
  const arxivUrl = pub.arxiv ? `https://arxiv.org/abs/${pub.arxiv}` : undefined;
  const linkUrl = pub.url || doiUrl || arxivUrl;
  const pdfUrl = pub.pdf ? `/papers/${pub.pdf}` : undefined;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
          width: "100%",
          maxWidth: 640,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            {pub.venue} · {pub.year}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ overflowY: "auto", padding: "20px 16px", flex: 1 }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.4,
              color: "var(--foreground)",
              margin: "0 0 10px",
              fontFamily: "inherit",
            }}
          >
            {pub.title}
          </h2>
          <p
            style={{
              fontSize: 11,
              color: "var(--muted)",
              margin: "0 0 20px",
              lineHeight: 1.6,
            }}
          >
            {pub.authors}
          </p>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 20 }} />
          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            {pub.abstract}
          </p>
        </div>

        {/* Modal footer — links */}
        {(pdfUrl || linkUrl || arxivUrl) && (
          <div
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  textDecoration: "none",
                  border: "1px solid var(--border)",
                  padding: "4px 10px",
                }}
              >
                <FileText size={12} /> PDF
              </a>
            )}
            {arxivUrl && (
              <a
                href={arxivUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  textDecoration: "none",
                  border: "1px solid var(--border)",
                  padding: "4px 10px",
                }}
              >
                <ExternalLink size={12} /> arXiv
              </a>
            )}
            {linkUrl && linkUrl !== arxivUrl && (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  textDecoration: "none",
                  border: "1px solid var(--border)",
                  padding: "4px 10px",
                }}
              >
                <ExternalLink size={12} /> Paper
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PublicationGrid({ publications }: { publications: Publication[] }) {
  const [selected, setSelected] = useState<Publication | null>(null);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          width: "100%",
          height: "100%",
        }}
      >
        {publications.map((pub) => (
          <div key={pub.title} style={{ minHeight: 0, minWidth: 0 }}>
            <PubCard pub={pub} onClick={() => setSelected(pub)} />
          </div>
        ))}
      </div>

      {selected && (
        <PubModal pub={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
