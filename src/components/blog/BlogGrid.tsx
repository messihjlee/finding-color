import type { BlogPost } from "@/types";
import { BlogCard } from "./BlogCard";

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <BlogCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
