"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { publications } from "@/lib/projects";
import { PublicationCard } from "./ProjectCard";

const ITEMS_PER_PAGE = 2;

export function PublicationSlider() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(publications.length / ITEMS_PER_PAGE);
  const start = page * ITEMS_PER_PAGE;
  const current = publications.slice(start, start + ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl px-6 md:px-8">
      <div className="w-full">
        {current.map((pub) => (
          <PublicationCard key={pub.title} pub={pub} />
        ))}
      </div>

      <div className="flex items-center gap-6 mt-8">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="text-muted transition-colors hover:text-foreground disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-sm text-muted">
          {page + 1} / {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="text-muted transition-colors hover:text-foreground disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
