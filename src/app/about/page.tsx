import type { Metadata } from "next";
import Image from "next/image";
export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
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
        <article className="mx-auto max-w-3xl px-6 py-8 md:px-8">
          <div className="space-y-6 text-muted leading-relaxed text-lg md:text-xl">
            <Image
              src="/images/profile_pic.png"
              alt="Messi H.J. Lee"
              width={240}
              height={240}
              className="rounded-lg object-cover float-left mr-5 mb-3 w-36 h-36 md:w-60 md:h-60"
              priority
            />
            <p>
              Hi! I&apos;m Messi H.J. Lee. In May of 2025, I completed my PhD
              in Computational and Data Sciences at Washington University in St.
              Louis (WashU). During my PhD, I was advised by two amazing
              advisors&mdash;
              <a
                href="https://scholar.google.com/citations?hl=en&user=Nkkrs_YAAAAJ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 transition-colors hover:text-muted"
              >
                Calvin K. Lai
              </a>{" "}
              in the Department of Psychology at Rutgers University and{" "}
              <a
                href="https://scholar.google.com/citations?user=GaWC-J4AAAAJ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 transition-colors hover:text-muted"
              >
                Jacob M. Montgomery
              </a>{" "}
              in the Political Sciences Department at WashU.
            </p>

            <p>
              My research is in the emerging field of{" "}
              <em>machine psychology</em>, specifically investigating
              stereotyping in AI models. I recently completed work looking at{" "}
              <a
                href="https://arxiv.org/abs/2503.11572"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 transition-colors hover:text-muted"
              >
                implicit bias in reasoning models
              </a>{" "}
              where we discover that reasoning models require significantly more
              computational resources to process association-incompatible
              information (e.g., men-family &amp; women-career) compared to
              association-compatible information (e.g., men-career &amp;
              women-family). This finding suggests that even advanced AI systems
              exhibit processing patterns analogous to human implicit bias.
            </p>

            <p>
              I am currently in South Korea fulfilling my military service
              obligation as a technical research personnel (전문연구요원)
              developing AI models for pathology and doing research related to
              bias in pathology-related AI models. If you would like to
              collaborate on topics related to AI bias and stereotyping, feel
              free to reach out to me at messihjlee@gmail.com.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
