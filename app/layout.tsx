import type { Metadata } from "next";
import { Anton, Inter, IBM_Plex_Mono } from "next/font/google";
import SiteChrome from "@/components/SiteChrome";
import { getRadioEpisodes, getReels } from "@/lib/data";
import "./globals.css";

const anton = Anton({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = "https://krantas.lt";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Krantas",
    template: "%s · Krantas",
  },
  description: "Krantas - naktinis klubas",
  applicationName: "Krantas",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "lt_LT",
    url: siteUrl,
    siteName: "Krantas",
    title: "Krantas",
    description: "Krantas - naktinis klubas",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Krantas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krantas",
    description: "Krantas - naktinis klubas",
    images: ["/og-image.jpg"],
  },
};

export const revalidate = 60;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The persistent "Krantas Sets" player in the nav (SetsPlayer, mounted
  // inside SiteChrome/Nav on every page) used to fetch its playlist
  // client-side, which meant the fallback placeholder track flashed in
  // the header on every single page load. Fetching it here means it's
  // already resolved by the time the header renders.
  const [episodes, reels] = await Promise.all([getRadioEpisodes(), getReels()]);
  return (
    <html lang="lt">
      <head>
        {/* Hero poster is set via CSS background-image (not <img>/next/image),
            so the browser can't discover it until CSS is parsed. It's the
            LCP element on the homepage, so preload it explicitly. */}
        <link rel="preload" as="image" href="/hero-poster.webp" fetchPriority="high" />
      </head>
      <body className={`${anton.variable} ${inter.variable} ${plexMono.variable}`}>
        <SiteChrome initialEpisodes={episodes} initialReels={reels}>{children}</SiteChrome>
      </body>
    </html>
  );
}
