import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MdxContent } from "@/components/blog/MdxContent";
import { getPostBySlug, getAllSlugs } from "@/lib/notion";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: post.title,
    description: post.description,
  };
}

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  books:  { bg: "#1a2a1a", color: "#4caf6e" },
  art:    { bg: "#2a1e12", color: "#c97d3a" },
  travel: { bg: "#111e2a", color: "#3a88c9" },
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

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
          minHeight: "calc(100svh - 36px)",
        }}
      >
        <article style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
          <header style={{ marginBottom: 48 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "0.01em",
                color: "var(--foreground)",
                marginBottom: 12,
              }}
            >
              {post.title}
            </h1>
            <time
              style={{
                display: "block",
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {post.tags.map((tag) => {
                  const c = TAG_COLORS[tag] ?? { bg: "#1a1c22", color: "#616978" };
                  return (
                    <span
                      key={tag}
                      style={{
                        background: c.bg,
                        color: c.color,
                        fontSize: 10,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        border: `1px solid ${c.color}30`,
                      }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </header>

          <div style={{ color: "var(--muted)" }}>
            <MdxContent source={post.content} />
          </div>
        </article>
      </div>
    </div>
  );
}
