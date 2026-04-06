import type { Publication } from "@/lib/projects";
import { ExternalLink, FileText } from "lucide-react";

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function PublicationCard({ pub }: { pub: Publication }) {
  const doiUrl = pub.doi ? `https://doi.org/${pub.doi}` : undefined;
  const arxivUrl = pub.arxiv
    ? `https://arxiv.org/abs/${pub.arxiv}`
    : undefined;
  const linkUrl = pub.url || doiUrl || arxivUrl;
  const pdfUrl = pub.pdf ? `/papers/${pub.pdf}` : undefined;

  return (
    <article>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight leading-snug md:text-2xl">
            {linkUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-muted"
              >
                {truncate(pub.title, 100)}
              </a>
            ) : (
              truncate(pub.title, 100)
            )}
          </h2>
          <p className="mt-1 text-base text-muted md:text-xl">
            {pub.venue} &middot; {pub.year}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted transition-colors hover:text-foreground"
              aria-label={`PDF: ${pub.title}`}
            >
              <FileText size={28} />
            </a>
          )}
          {linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted transition-colors hover:text-foreground"
              aria-label={`View ${pub.title}`}
            >
              <ExternalLink size={28} />
            </a>
          )}
        </div>
      </div>
      <p className="mt-6 text-base text-muted leading-relaxed md:text-xl">
        {truncate(pub.abstract, 280)}
      </p>
    </article>
  );
}
