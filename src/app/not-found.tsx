import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container>
      <section className="py-28 md:py-40 text-center">
        <h1 className="text-6xl font-bold tracking-tight md:text-8xl">404</h1>
        <p className="mt-4 text-lg text-muted">
          This page doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Go home
        </Link>
      </section>
    </Container>
  );
}
