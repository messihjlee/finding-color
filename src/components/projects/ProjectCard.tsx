import type { Publication } from "@/lib/projects";
import { ExternalLink } from "lucide-react";

export function PublicationCard({ pub }: { pub: Publication }) {
  const doiUrl = pub.doi ? `https://doi.org/${pub.doi}` : undefined;
  const arxivUrl = pub.arxiv
    ? `https://arxiv.org/abs/${pub.arxiv}`
    : undefined;
  const linkUrl = doiUrl || arxivUrl;

  return (
    <article>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight leading-snug md:text-4xl">
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
          <p className="mt-2 text-base text-muted md:text-xl">{pub.authors}</p>
          <p className="mt-1 text-base text-muted md:text-xl">
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
            <ExternalLink size={28} />
          </a>
        )}
      </div>
      <p className="mt-6 text-base text-muted leading-relaxed md:text-xl">
        {pub.abstract}
      </p>
    </article>
  );
}
