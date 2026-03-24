import type { Metadata } from "next";
import { getAllPosts } from "@/lib/notion";
import { BlogSlider } from "@/components/blog/BlogSlider";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
};

const MARGIN = 30;

export default async function BlogPage() {
  const posts = await getAllPosts();

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
        <div className="flex items-center justify-center px-4 pb-8 pt-8" style={{ minHeight: `calc(100vh - ${MARGIN * 2}px)` }}>
          <div className="mx-auto w-full" style={{ maxWidth: "calc(100vh - 60px)" }}>
            <BlogSlider posts={posts} />
          </div>
        </div>
      </div>
    </div>
  );
}
