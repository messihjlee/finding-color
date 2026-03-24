import type { Publication } from "@/lib/projects";
import { ExternalLink } from "lucide-react";

export function PublicationCard({ pub }: { pub: Publication }) {
  const doiUrl = pub.doi ? `https://doi.org/${pub.doi}` : undefined;
  const arxivUrl = pub.arxiv
    ? `https://arxiv.org/abs/${pub.arxiv}`
    : undefined;
  const linkUrl = doiUrl || arxivUrl;

  return (
    <article className="border-b border-border py-4 first:pt-0 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight leading-snug md:text-xl">
            {linkUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-muted"
              >
                {pub.title}
              </a>
            ) : (
              pub.title
            )}
          </h2>
          <p className="mt-1 text-xs text-muted md:text-sm">{pub.authors}</p>
          <p className="mt-0.5 text-xs text-muted md:text-sm">
            {pub.venue} &middot; {pub.year}
          </p>
        </div>
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted transition-colors hover:text-foreground"
            aria-label={`View ${pub.title}`}
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
      <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-3 md:text-sm md:line-clamp-4">
        {pub.abstract}
      </p>
    </article>
  );
}
