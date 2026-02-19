import { siteConfig } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="py-8">
      <div className="mx-auto max-w-3xl px-8">
        <p className="text-sm text-muted">
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
