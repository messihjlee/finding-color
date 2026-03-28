export default function BlogLoading() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", paddingTop: "3vh" }}
    >
      <div
        style={{
          borderTop: "1px solid",
          borderColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
          minHeight: "calc(100dvh - 3vh)",
        }}
      />
    </div>
  );
}
