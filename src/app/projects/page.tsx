import type { Metadata } from "next";
import { PublicationGrid } from "@/components/projects/PublicationGrid";
import { getPublications } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Publications",
};

export default function ProjectsPage() {
  const publications = getPublications();

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--background)",
        paddingTop: 36,
      }}
    >
      <div
        style={{
          borderTop: "1px solid var(--border)",
          height: "calc(100svh - 36px)",
          padding: "24px 16px",
        }}
      >
        <PublicationGrid publications={publications} />
      </div>
    </div>
  );
}
