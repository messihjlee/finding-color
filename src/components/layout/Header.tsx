"use client";

import { navLinks } from "@/lib/constants";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Theme toggle — fixed top-left */}
      <div className="fixed left-5 top-5 z-50 md:left-6 md:top-6">
        <ThemeToggle />
      </div>

      {/* Desktop sidebar — vertically centered */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-48 flex-col items-start justify-center px-8 md:flex">
        <nav className="flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => scrollTo(e, link.href)}
              className="block text-lg text-muted transition-all duration-200 ease-out hover:text-foreground hover:text-2xl"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-end bg-background/80 px-5 backdrop-blur-sm md:hidden">
        <MobileMenu />
      </header>
    </>
  );
}
