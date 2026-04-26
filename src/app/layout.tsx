import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import { GlobalHeader } from "@/components/ui/GlobalHeader";
import { siteConfig } from "@/lib/constants";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <Providers>
          <GlobalHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
