import type { Metadata } from "next";
import { PublicationSlider } from "@/components/projects/PublicationSlider";

export const metadata: Metadata = {
  title: "Publications",
};

export default function ProjectsPage() {
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
        <PublicationSlider />
      </div>
    </div>
  );
}
