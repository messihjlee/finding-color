"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { publications } from "@/lib/projects";
import { PublicationCard } from "./ProjectCard";

export function PublicationSlider() {
  const [page, setPage] = useState(0);

  const itemsPerPage = 1;
  const totalPages = Math.ceil(publications.length / itemsPerPage);
  const start = page * itemsPerPage;
  const current = publications.slice(start, start + itemsPerPage);

  return (
    <div className="flex flex-col w-[90%] mx-auto h-full py-10 md:py-16">
      <div className="flex items-center w-full gap-4 flex-1">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="shrink-0 text-muted transition-colors hover:text-foreground disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft size={28} className="sm:hidden" />
          <ChevronLeft size={40} className="hidden sm:block" />
        </button>

        <div className="flex-1 mx-auto overflow-y-auto">
          {current.map((pub) => (
            <PublicationCard key={pub.title} pub={pub} />
          ))}
        </div>

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="shrink-0 text-muted transition-colors hover:text-foreground disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight size={28} className="sm:hidden" />
          <ChevronRight size={40} className="hidden sm:block" />
        </button>
      </div>

      <span className="mt-6 text-center text-base text-muted">
        {page + 1} / {totalPages}
      </span>
    </div>
  );
}
