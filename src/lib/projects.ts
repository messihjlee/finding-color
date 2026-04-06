import fs from "fs";
import path from "path";

export interface Publication {
  title: string;
  authors: string;
  year: number;
  venue: string;
  url?: string;
  doi?: string;
  arxiv?: string;
  pdf?: string;
  abstract: string;
  selected: boolean;
}

function stripBraces(s: string): string {
  return s.replace(/[{}]/g, "");
}

function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const commaIdx = body.indexOf(",");
  if (commaIdx === -1) return fields;

  let i = commaIdx + 1;

  while (i < body.length) {
    while (i < body.length && /[\s,]/.test(body[i])) i++;
    if (i >= body.length) break;

    const nameStart = i;
    while (i < body.length && body[i] !== "=" && !/\s/.test(body[i])) i++;
    const name = body.slice(nameStart, i).trim().toLowerCase();

    while (i < body.length && /\s/.test(body[i])) i++;
    if (i >= body.length || body[i] !== "=") break;
    i++; // skip '='

    while (i < body.length && /\s/.test(body[i])) i++;

    let value = "";
    if (i < body.length && body[i] === "{") {
      let depth = 1;
      i++;
      const valueStart = i;
      while (i < body.length && depth > 0) {
        if (body[i] === "{") depth++;
        else if (body[i] === "}") depth--;
        i++;
      }
      value = body.slice(valueStart, i - 1);
    } else if (i < body.length && body[i] === '"') {
      i++;
      const valueStart = i;
      while (i < body.length && body[i] !== '"') i++;
      value = body.slice(valueStart, i);
      i++;
    } else {
      const valueStart = i;
      while (
        i < body.length &&
        body[i] !== "," &&
        body[i] !== "\n" &&
        body[i] !== "}"
      )
        i++;
      value = body.slice(valueStart, i).trim();
    }

    if (name) fields[name] = value;
  }

  return fields;
}

function parseEntries(
  content: string
): Array<{ type: string; fields: Record<string, string> }> {
  const entries: Array<{ type: string; fields: Record<string, string> }> = [];
  let i = 0;

  while (i < content.length) {
    const atIdx = content.indexOf("@", i);
    if (atIdx === -1) break;

    const braceIdx = content.indexOf("{", atIdx);
    if (braceIdx === -1) break;

    const type = content.slice(atIdx + 1, braceIdx).trim().toLowerCase();

    let depth = 1;
    let j = braceIdx + 1;
    while (j < content.length && depth > 0) {
      if (content[j] === "{") depth++;
      else if (content[j] === "}") depth--;
      j++;
    }

    const body = content.slice(braceIdx + 1, j - 1);
    entries.push({ type, fields: parseFields(body) });
    i = j;
  }

  return entries;
}

function toPublication(
  type: string,
  fields: Record<string, string>
): Publication | null {
  const title = stripBraces(fields.title ?? "");
  const authors = stripBraces(fields.author ?? "");
  const year = parseInt(fields.year ?? "0", 10);
  const abstract = stripBraces(fields.abstract ?? "");
  const selected = fields.selected === "true";
  const url = fields.url || undefined;
  const doi = fields.doi || undefined;
  const arxiv = fields.eprint || undefined;
  const pdf = fields.pdf || undefined;

  let venue = "";
  if (type === "article") {
    venue = stripBraces(fields.journal ?? "");
  } else if (type === "inproceedings") {
    venue = stripBraces(fields.series ?? fields.booktitle ?? "");
  } else {
    venue = stripBraces(fields.publisher ?? "");
  }

  if (!title || !authors || !year) return null;

  return { title, authors, year, venue, url, doi, arxiv, pdf, abstract, selected };
}

export function getPublications(): Publication[] {
  const bibPath = path.join(process.cwd(), "content", "papers.bib");
  const content = fs.readFileSync(bibPath, "utf-8");
  return parseEntries(content)
    .map(({ type, fields }) => toPublication(type, fields))
    .filter((p): p is Publication => p !== null);
}
