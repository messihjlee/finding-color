import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";

function ColumnImages({ data }: { data: string }) {
  const images: { src: string; alt: string }[] = JSON.parse(
    Buffer.from(data, "base64").toString("utf8")
  );
  return (
    <div style={{ display: "flex", gap: "0.75rem", margin: "1.5rem 0" }}>
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          style={{ flex: 1, minWidth: 0, maxWidth: "100%", height: "auto" }}
        />
      ))}
    </div>
  );
}

const components = {
  ColumnImages,
  h1: (props: React.ComponentProps<"h1">) => (
    <h1 className="mt-10 mb-4 text-3xl font-bold tracking-tight" {...props} />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h2 className="mt-8 mb-3 text-2xl font-semibold tracking-tight" {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3 className="mt-6 mb-2 text-xl font-semibold" {...props} />
  ),
  p: (props: React.ComponentProps<"p">) => (
    <p className="mb-4 leading-relaxed" {...props} />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a className="underline underline-offset-4 hover:text-muted" {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="mb-4 list-disc pl-6 space-y-1" {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol className="mb-4 list-decimal pl-6 space-y-1" {...props} />
  ),
  hr: (props: React.ComponentProps<"hr">) => (
    <hr className="my-4 border-border" {...props} />
  ),
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote className="mt-6 mb-4 border-l-2 border-border pl-4 italic text-muted" {...props} />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code className="bg-card px-1.5 py-0.5 text-sm" {...props} />
  ),
  pre: (props: React.ComponentProps<"pre">) => (
    <pre className="mb-4 overflow-x-auto border border-border bg-card p-4 text-sm" {...props} />
  ),
  img: (props: React.ComponentProps<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img style={{ maxWidth: "100%", height: "auto" }} alt={props.alt ?? ""} {...props} />
  ),
};

export async function MdxContent({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    components,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        rehypePlugins: [
          [rehypePrettyCode, { theme: "github-dark-dimmed", keepBackground: true }],
        ],
      },
    },
  });

  return <div className="prose-custom">{content}</div>;
}
