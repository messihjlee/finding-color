import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/types";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{
        display: "block",
        height: "100%",
        textDecoration: "none",
        border: "1px solid var(--border)",
        background: "var(--card)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {post.coverImage ? (
        <>
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            style={{ objectFit: "cover", opacity: 0.6 }}
            sizes="(max-width: 640px) 100vw, 33vw"
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(14,15,17,0.9) 0%, transparent 60%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "12px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.04em",
                color: "var(--foreground)",
                lineHeight: 1.4,
              }}
            >
              {post.title}
            </p>
            <time
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--muted)",
                textTransform: "uppercase",
              }}
            >
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })}
            </time>
          </div>
        </>
      ) : (
        <div
          style={{
            display: "flex",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.04em",
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            {post.title}
          </p>
        </div>
      )}
    </Link>
  );
}
