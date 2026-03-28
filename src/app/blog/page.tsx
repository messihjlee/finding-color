import type { Metadata } from "next";
import { getAllPosts } from "@/lib/notion";
import { BlogSlider } from "@/components/blog/BlogSlider";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", paddingTop: "3vh" }}
    >
      <div
        className="flex items-center justify-center px-4 pb-8 pt-8"
        style={{
          borderTop: "1px solid",
          borderColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
          minHeight: "calc(100dvh - 3vh)",
        }}
      >
        <div className="mx-auto w-full">
          <BlogSlider posts={posts} />
        </div>
      </div>
    </div>
  );
}
