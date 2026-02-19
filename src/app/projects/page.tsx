import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { ProjectList } from "@/components/projects/ProjectList";

export const metadata: Metadata = {
  title: "Publications",
};

const MARGIN = 30;

export default function ProjectsPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", padding: MARGIN }}
    >
      <div
        style={{
          border: "1px solid var(--foreground)",
          minHeight: `calc(100vh - ${MARGIN * 2}px)`,
          borderColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
          <SiteHeader />

          <h1 className="mt-8 text-3xl font-bold tracking-tight md:text-4xl">
            Publications
          </h1>
          <p className="mt-4 text-muted">
            Research on stereotyping and bias in AI models.
          </p>

          <div className="mt-12">
            <ProjectList />
          </div>
        </div>
      </div>
    </div>
  );
}
