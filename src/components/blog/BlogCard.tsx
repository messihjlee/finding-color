import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/types";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group relative block">
      <div className="relative aspect-square overflow-hidden bg-card">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted text-sm">
            {post.title}
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/50">
          <h2 className="px-4 text-center text-sm font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {post.title}
          </h2>
          <time className="mt-1 text-xs text-white/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </div>
    </Link>
  );
}
