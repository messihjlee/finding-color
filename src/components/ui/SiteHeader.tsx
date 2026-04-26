import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/blog",     label: "BLOG"     },
  { href: "/about",    label: "ABOUT"    },
  { href: "/projects", label: "PROJECTS" },
  { href: "/contact",  label: "CONTACT"  },
];

const linkStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.14em",
  color: "var(--muted)",
  textDecoration: "none",
  textTransform: "uppercase",
};

export function SiteHeader() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--background)",
        zIndex: 50,
      }}
    >
      <Link href="/" style={linkStyle} aria-label="Home">
        FINDING-COLOR
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <nav style={{ display: "flex", gap: 24 }}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} style={linkStyle}>
              {item.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </div>
  );
}
