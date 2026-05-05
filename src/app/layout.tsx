import type { Metadata } from "next";
import "./globals.css";

import { ScrollToTopButton } from "@/components/layout/scroll-to-top-button";

export const metadata: Metadata = {
  metadataBase: new URL("https://allearbuds.com"),
  title: {
    default: "AllEarbuds | Deals on Earbuds, Watches and Accessories",
    template: "%s | AllEarbuds",
  },
  description:
    "Shop compact deals on earbuds, smart watches, neckbands, speakers, power banks and mobile accessories.",
  applicationName: "AllEarbuds",
  openGraph: {
    title: "AllEarbuds",
    description:
      "Modern ecommerce storefront for audio, wearables and daily tech accessories.",
    url: "https://allearbuds.com",
    siteName: "AllEarbuds",
    type: "website",
  },
};

const themeScript = `
(() => {
  try {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", saved ? saved === "dark" : prefersDark);
  } catch {
    document.documentElement.classList.remove("dark");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <ScrollToTopButton />
      </body>
    </html>
  );
}
