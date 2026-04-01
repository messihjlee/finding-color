import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/ui/SiteHeader";
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
      className="min-h-screen"
      style={{ background: "var(--background)", paddingTop: "3vh" }}
    >
      <div
        style={{
          borderTop: "1px solid",
          borderColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
          minHeight: "calc(100dvh - 3vh)",
        }}
      >
        <article className="mx-auto max-w-5xl px-6 py-8 md:px-8">
          <SiteHeader />

          <header className="mt-8">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {post.title}
            </h1>
            <time className="mt-3 block text-lg text-muted">
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1 text-base font-medium"
                    style={
                      tag === "books"
                        ? { background: "#DBEDDB", color: "#1C7048" }
                        : tag === "art"
                        ? { background: "#FADEC9", color: "#C9700F" }
                        : tag === "travel"
                        ? { background: "#D3E5EF", color: "#0B6E99" }
                        : { background: "#E3E2E0", color: "#6B6B6B" }
                    }
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="mt-12">
            <MdxContent source={post.content} />
          </div>
        </article>
      </div>
    </div>
  );
}
