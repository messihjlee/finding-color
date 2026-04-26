import type { Publication } from "@/lib/projects";
import { ExternalLink, FileText } from "lucide-react";

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function PublicationCard({ pub }: { pub: Publication }) {
  const doiUrl = pub.doi ? `https://doi.org/${pub.doi}` : undefined;
  const arxivUrl = pub.arxiv ? `https://arxiv.org/abs/${pub.arxiv}` : undefined;
  const linkUrl = pub.url || doiUrl || arxivUrl;
  const pdfUrl = pub.pdf ? `/papers/${pub.pdf}` : undefined;

  const iconBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    color: "var(--muted)",
    textDecoration: "none",
    cursor: "pointer",
  };

  return (
    <article style={{ border: "1px solid var(--border)", padding: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "var(--muted)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            {pub.venue} · {pub.year}
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4, color: "var(--foreground)", margin: 0 }}>
            {linkUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {truncate(pub.title, 100)}
              </a>
            ) : (
              truncate(pub.title, 100)
            )}
          </h2>
        </div>

        <div style={{ display: "flex", gap: 12, flexShrink: 0, paddingTop: 4 }}>
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={iconBtnStyle} aria-label={`PDF: ${pub.title}`}>
              <FileText size={18} />
            </a>
          )}
          {linkUrl && (
            <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={iconBtnStyle} aria-label={`View ${pub.title}`}>
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: "var(--border)",
          margin: "16px 0",
        }}
      />

      <p
        style={{
          fontSize: 13,
          color: "var(--muted)",
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {truncate(pub.abstract, 320)}
      </p>
    </article>
  );
}
