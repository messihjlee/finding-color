export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  coverImage: string;
  tags: string[];
  content: string;
}

export interface BlogFrontmatter {
  title: string;
  date: string;
  description: string;
  coverImage: string;
  tags: string[];
}

export interface Project {
  title: string;
  date: string;
  role: string;
  description: string;
  url?: string;
  github?: string;
  tech: string[];
}
