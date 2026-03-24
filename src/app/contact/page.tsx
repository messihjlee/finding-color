import type { Metadata } from "next";
import { Mail, Github, GraduationCap } from "lucide-react";
export const metadata: Metadata = {
  title: "Contact",
};

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
        <ul className="space-y-10">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-6 text-foreground transition-colors hover:text-muted"
              >
                <link.icon className="shrink-0 w-7 h-7 sm:w-9 sm:h-9" />
                <div>
                  <div className="text-xl font-medium sm:text-2xl">{link.label}</div>
                  <div className="text-2xl text-muted transition-colors group-hover:text-foreground sm:text-3xl">
                    {link.display}
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
