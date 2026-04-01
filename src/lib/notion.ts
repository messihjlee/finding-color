import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import type { BlogPost } from "@/types";

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client({ auth: process.env.NOTION_API_KEY });
  }
  return client;
}

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

export const CATEGORIES = ["books", "art", "travel"] as const;
export type Category = (typeof CATEGORIES)[number];

/* eslint-disable @typescript-eslint/no-explicit-any */

function extractCoverImage(page: any): string {
  if (page.cover) {
    if (page.cover.type === "external") return page.cover.external.url;
    if (page.cover.type === "file") return page.cover.file.url;
  }
  return "";
}

function extractText(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") {
    return prop.title.map((t: any) => t.plain_text).join("");
  }
  if (prop.type === "rich_text") {
    return prop.rich_text.map((t: any) => t.plain_text).join("");
  }
  return "";
}

function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s가-힣-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .toLowerCase() || "untitled"
  );
}

function pageToPost(page: any, content = ""): BlogPost {
  const props = page.properties;

  const titleProp = props["title"] ?? Object.values(props).find((p: any) => p?.type === "title");
  const title = extractText(titleProp);
  const slug = `${page.id.split("-")[0]}-${slugify(title)}`;

  const date =
    props["date"]?.type === "date" && props["date"].date
      ? props["date"].date.start
      : page.created_time.split("T")[0];

  const author = extractText(props["author"]);
  const description = author ? `by ${author}` : "";

  const category =
    props["category"]?.type === "select" && props["category"].select
      ? props["category"].select.name
      : "";

  const tags: string[] = category ? [category] : [];

  return {
    slug,
    title,
    date,
    description,
    coverImage: extractCoverImage(page),
    tags,
    content,
  };
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const notion = getClient();

  const allResults: any[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [{ property: "date", direction: "descending" }],
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    allResults.push(...response.results);
    cursor = response.has_more && response.next_cursor ? response.next_cursor : undefined;
  } while (cursor);

  return allResults
    .filter((p: any) => "properties" in p)
    .map((page: any) => pageToPost(page));
}

export async function getPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const notion = getClient();

  const idPrefix = slug.split("-")[0];

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
  });

  const page = response.results.find((p: any) => {
    if (!("properties" in p)) return false;
    return p.id.startsWith(idPrefix);
  });

  if (!page || !("properties" in page)) return null;

  const n2m = new NotionToMarkdown({ notionClient: notion });

  // Placeholders let us insert JSX *after* the angle-bracket escaping runs,
  // so S3 URLs with '&' in them don't get mangled.
  const columnJSX = new Map<string, string>();

  n2m.setCustomTransformer("column_list", async (block: any) => {
    const { results: columns } = await notion.blocks.children.list({ block_id: block.id });

    const columnItems: any[][] = await Promise.all(
      columns.map(async (col: any) => {
        const { results } = await notion.blocks.children.list({ block_id: col.id });
        return results;
      })
    );

    const placeholder = `__COLPLACEHOLDER_${block.id.replace(/-/g, "")}_END__`;

    const allImages = columnItems.every(
      (children) => children.length === 1 && children[0].type === "image"
    );

    if (allImages) {
      const images = columnItems.map((children) => {
        const img = children[0].image;
        const src: string = img.type === "file" ? img.file.url : img.external.url;
        const alt = img.caption?.map((c: any) => c.plain_text).join("") || "";
        return { src, alt };
      });
      // Base64-encode so the JSX attribute is pure alphanumeric — no escaping issues.
      const encoded = Buffer.from(JSON.stringify(images)).toString("base64");
      columnJSX.set(placeholder, `<ColumnImages data="${encoded}" />`);
    } else {
      // Text columns: process as markdown (will be escaped normally)
      const parts = await Promise.all(
        columnItems.map(async (children) => {
          const mdBlocks = await n2m.blocksToMarkdown(children as any);
          return n2m.toMarkdownString(mdBlocks).parent || "";
        })
      );
      columnJSX.set(placeholder, parts.join("\n\n"));
    }

    return placeholder;
  });

  const blocks = await n2m.pageToMarkdown(page.id);
  const markdown = n2m.toMarkdownString(blocks);

  // Escape angle brackets that MDX would misinterpret as JSX tags
  let safeContent = markdown.parent
    .replace(/<([^\x00-\x7F])/g, "&lt;$1")
    .replace(/<([A-Z][^>\n]*)>/g, (_, inner) => `&lt;${inner}&gt;`)
    .replace(/<([^>\n]*(?:&|[^\x00-\x7F])[^>\n]*)>/g, (_, inner) => `&lt;${inner}&gt;`);

  // Substitute placeholders after escaping
  for (const [placeholder, jsx] of columnJSX) {
    safeContent = safeContent.replace(placeholder, jsx);
  }

  return pageToPost(page, safeContent);
}

export async function getAllSlugs(): Promise<string[]> {
  const notion = getClient();

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    sorts: [{ property: "date", direction: "descending" }],
  });

  return response.results
    .filter((p: any) => "properties" in p)
    .map((page: any) => pageToPost(page).slug)
    .filter(Boolean);
}
