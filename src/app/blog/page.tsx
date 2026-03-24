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
      className="min-h-screen p-4 md:p-[30px]"
      style={{ background: "var(--background)" }}
    >
      <div
        className="flex items-center justify-center px-4 pb-8 pt-8 min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-60px)]"
        style={{
          border: "1px solid var(--foreground)",
          borderColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
        }}
      >
        <div className="mx-auto w-full max-w-3xl">
          <BlogSlider posts={posts} />
        </div>
      </div>
    </div>
  );
}
