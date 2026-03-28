import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
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
      style={{ background: "var(--background)", paddingTop: "3vh", paddingBottom: "3vh" }}
    >
      <div
        style={{
          borderTop: "1px solid",
          borderBottom: "1px solid",
          borderColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
          minHeight: "calc(100dvh - 6vh)",
        }}
      >
        <article className="mx-auto max-w-3xl px-6 py-8 md:px-8">
          <SiteHeader />

          <header className="mt-8">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {post.title}
            </h1>
            <time className="mt-3 block text-sm text-muted">
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
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {post.coverImage && (
            <div className="relative mt-10 aspect-[2/1] overflow-hidden rounded-lg border border-border">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="mt-12">
            <MdxContent source={post.content} />
          </div>
        </article>
      </div>
    </div>
  );
}
