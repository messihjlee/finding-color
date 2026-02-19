import type { Metadata } from "next";
import { getAllPosts } from "@/lib/notion";
import { CategoryBookmarks } from "@/components/blog/CategoryBookmarks";
import { SiteHeader } from "@/components/ui/SiteHeader";

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
        <div className="px-6 py-8">
          <SiteHeader />

          <h1 className="mt-6 text-2xl font-bold tracking-tight">Blog</h1>
        </div>

        <div className="px-6 pb-8">
          <CategoryBookmarks posts={posts} />
        </div>
      </div>
    </div>
  );
}
