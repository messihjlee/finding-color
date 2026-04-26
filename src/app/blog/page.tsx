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
        <BlogSlider posts={posts} />
      </div>
    </div>
  );
}
