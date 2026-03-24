"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { publications } from "@/lib/projects";
import { PublicationCard } from "./ProjectCard";

export function PublicationSlider() {
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const itemsPerPage = isMobile ? 1 : 2;
  const totalPages = Math.ceil(publications.length / itemsPerPage);
  const start = page * itemsPerPage;
  const current = publications.slice(start, start + itemsPerPage);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl px-2 md:px-4">
      <div className="flex items-center w-full gap-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="shrink-0 text-muted transition-colors hover:text-foreground disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft size={24} className="sm:hidden" />
          <ChevronLeft size={40} className="hidden sm:block" />
        </button>

        <div className="flex-1">
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
          <ChevronRight size={24} className="sm:hidden" />
          <ChevronRight size={40} className="hidden sm:block" />
        </button>
      </div>

      <span className="mt-6 text-base text-muted">
        {page + 1} / {totalPages}
      </span>
    </div>
  );
}
