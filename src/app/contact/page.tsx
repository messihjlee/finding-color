import type { Metadata } from "next";
import { Mail, Github, GraduationCap } from "lucide-react";
import { SiteHeader } from "@/components/ui/SiteHeader";

export const metadata: Metadata = {
  title: "Contact",
};

const MARGIN = 30;

const links = [
  {
    label: "Email",
    href: "mailto:messihjlee@gmail.com",
    icon: Mail,
    display: "messihjlee@gmail.com",
  },
  {
    label: "GitHub",
    href: "https://github.com/messihjlee",
    icon: Github,
    display: "github.com/messihjlee",
  },
  {
    label: "Google Scholar",
    href: "https://scholar.google.com/citations?user=qUz4nA8AAAAJ",
    icon: GraduationCap,
    display: "Google Scholar",
  },
];

export default function ContactPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", padding: MARGIN }}
    >
      <div
        style={{
          border: "1px solid var(--foreground)",
          minHeight: `calc(100vh - ${MARGIN * 2}px)`,
          borderColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
          <SiteHeader />

          <h1 className="mt-8 text-3xl font-bold tracking-tight md:text-4xl">
            Contact
          </h1>
          <p className="mt-4 text-muted">
            Want to get in touch? Reach out through any of the links below.
          </p>

          <ul className="mt-12 space-y-6">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 text-foreground transition-colors hover:text-muted"
                >
                  <link.icon size={20} className="shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{link.label}</div>
                    <div className="text-muted group-hover:text-foreground transition-colors">
                      {link.display}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
