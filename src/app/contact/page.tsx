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
      style={{
        minHeight: "100svh",
        background: "var(--background)",
        paddingTop: 36,
      }}
    >
      <div
        style={{
          borderTop: "1px solid var(--border)",
          minHeight: "calc(100svh - 36px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 360 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--muted)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            CONTACT
          </div>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 24 }} />

          <div style={{ border: "1px solid var(--border)" }}>
            {links.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px",
                  borderBottom:
                    i < links.length - 1 ? "1px solid var(--border)" : undefined,
                  color: "var(--muted)",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <link.icon size={16} style={{ flexShrink: 0, color: "var(--muted)" }} />
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--foreground)",
                      marginBottom: 2,
                    }}
                  >
                    {link.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {link.display}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
