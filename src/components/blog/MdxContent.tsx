import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";

const components = {
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
    <a className="underline underline-offset-4 transition-colors hover:text-muted" {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="mb-4 list-disc pl-6 space-y-1" {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol className="mb-4 list-decimal pl-6 space-y-1" {...props} />
  ),
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote className="mb-4 border-l-2 border-border pl-4 italic text-muted" {...props} />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code className="rounded bg-card px-1.5 py-0.5 text-sm" {...props} />
  ),
  pre: (props: React.ComponentProps<"pre">) => (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-card p-4 text-sm" {...props} />
  ),
  img: (props: React.ComponentProps<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="my-6 rounded-lg" alt={props.alt ?? ""} {...props} />
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
