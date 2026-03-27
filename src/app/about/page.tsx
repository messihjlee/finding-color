import type { Metadata } from "next";
import Image from "next/image";
import { readFileSync } from "fs";
import { join } from "path";
import { MdxContent } from "@/components/blog/MdxContent";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  const content = readFileSync(join(process.cwd(), "src/content/about.md"), "utf-8");

  return (
    <div
      className="min-h-screen p-4 md:p-[30px]"
      style={{ background: "var(--background)" }}
    >
      <div
        className="flex items-center justify-center min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-60px)]"
        style={{
          border: "1px solid var(--foreground)",
          borderColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
        }}
      >
        <article className="mx-auto max-w-3xl px-6 py-8 md:px-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/profile_pic.png"
              alt="Messi H.J. Lee"
              width={200}
              height={200}
              className="rounded-lg object-cover w-[200px] h-[200px]"
              priority
            />
          </div>
          <div className="text-muted text-[15px] md:text-xl">
            <MdxContent source={content} />
          </div>
        </article>
      </div>
    </div>
  );
}
