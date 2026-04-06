import type { Metadata } from "next";
import { PublicationSlider } from "@/components/projects/PublicationSlider";
import { getPublications } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Publications",
};

export default function ProjectsPage() {
  const publications = getPublications();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", paddingTop: "3vh" }}
    >
      <div
        className="flex items-stretch"
        style={{
          borderTop: "1px solid",
          borderColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
          height: "calc(100dvh - 3vh)",
        }}
      >
        <PublicationSlider publications={publications} />
      </div>
    </div>
  );
}
