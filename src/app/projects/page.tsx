import type { Metadata } from "next";
import { PublicationSlider } from "@/components/projects/PublicationSlider";

export const metadata: Metadata = {
  title: "Publications",
};

export default function ProjectsPage() {
  return (
    <div
      className="min-h-screen p-4 md:p-[30px]"
      style={{ background: "var(--background)" }}
    >
      <div
        className="flex items-stretch h-[calc(100dvh-2rem)] md:h-[calc(100dvh-60px)]"
        style={{
          border: "1px solid var(--foreground)",
          borderColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
        }}
      >
        <PublicationSlider />
      </div>
    </div>
  );
}
