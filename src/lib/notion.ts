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

  const title = extractText(props["title"]);
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

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    sorts: [{ property: "date", direction: "descending" }],
  });

  return response.results
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
  const blocks = await n2m.pageToMarkdown(page.id);
  const markdown = n2m.toMarkdownString(blocks);

  return pageToPost(page, markdown.parent);
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
