import type { Publication } from "@/lib/projects";
import { ExternalLink } from "lucide-react";

export function PublicationCard({ pub }: { pub: Publication }) {
  const doiUrl = pub.doi ? `https://doi.org/${pub.doi}` : undefined;
  const arxivUrl = pub.arxiv
    ? `https://arxiv.org/abs/${pub.arxiv}`
    : undefined;
  const linkUrl = doiUrl || arxivUrl;

  return (
    <article className="border-b border-border py-8 first:pt-0 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight leading-snug md:text-2xl">
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
          <p className="mt-1.5 text-sm text-muted md:text-base">{pub.authors}</p>
          <p className="mt-1 text-sm text-muted md:text-base">
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
            <ExternalLink size={18} />
          </a>
        )}
      </div>
      <p className="mt-3 text-base text-muted leading-relaxed md:text-lg">
        {pub.abstract}
      </p>
    </article>
  );
}
