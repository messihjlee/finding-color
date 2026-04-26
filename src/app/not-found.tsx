import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        height: "100svh",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "var(--muted)",
          textTransform: "uppercase",
        }}
      >
        404 — NOT FOUND
      </div>
      <Link
        href="/"
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          color: "var(--muted)",
          textDecoration: "none",
          textTransform: "uppercase",
          border: "1px solid var(--border)",
          padding: "8px 16px",
        }}
      >
        GO HOME
      </Link>
    </div>
  );
}
