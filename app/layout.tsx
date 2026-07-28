import type { Metadata } from "next";
import { Anton, Inter, IBM_Plex_Mono } from "next/font/google";
import SiteChrome from "@/components/SiteChrome";
import { getRadioEpisodes, getReels, getHomepageContent } from "@/lib/data";
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

// Primary local-SEO description: leads with the exact phrase we want to
// rank for ("naktinis klubas Klaipėdoje") since Google weighs the title/
// description highly for local intent queries, then folds in the brand
// voice used across the rest of the site.
const SITE_DESCRIPTION =
  "Krantas — naktinis klubas Klaipėdoje, uosto rajone. Techno, breaks ir bass vakarėliai, DJ setai, rezidentai ir gyvi pasirodymai kiekvieną savaitgalį.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Krantas — naktinis klubas Klaipėdoje",
    template: "%s · Krantas Klaipėda",
  },
  description: SITE_DESCRIPTION,
  // Google no longer uses meta keywords as a ranking signal, but Bing and
  // some other engines still read it, and it costs nothing to include —
  // just don't rely on it instead of the content/schema doing the work.
  keywords: [
    "naktinis klubas Klaipėda",
    "naktinis klubas Klaipėdoje",
    "klubas Klaipėdoje",
    "klubai Klaipėdoje",
    "vakarėliai Klaipėda",
    "techno klubas Klaipėda",
    "naktinis gyvenimas Klaipėda",
    "Krantas klubas",
    "Krantas Klaipėda",
    "geriausias klubas Klaipėdoje",
    "underground music club Klaipėda",
    "techno Klaipėda",
  ],
  applicationName: "Krantas",
  authors: [{ name: "Krantas", url: siteUrl }],
  creator: "Krantas",
  publisher: "Krantas",
  category: "Nightlife",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: { "lt-LT": siteUrl },
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
    title: "Krantas — naktinis klubas Klaipėdoje",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Krantas — naktinis klubas Klaipėdoje",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krantas — naktinis klubas Klaipėdoje",
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  // TODO: once you verify the property in Google Search Console, drop the
  // real verification code in here (Settings → Ownership verification →
  // "HTML tag" method gives you just the content string, no file needed):
  // verification: { google: "PASTE_CODE_HERE" },
};

// ── Structured data ────────────────────────────────────────────────────
// NightClub is a real schema.org type (subtype of EntertainmentBusiness /
// LocalBusiness) — this is the single highest-leverage thing for the
// "naktinis klubas Klaipėda" query, since it tells Google in an unambiguous,
// machine-readable way exactly what category of place this is and where.
// Coordinates below are approximate for Naujoji Uosto g. 3 — worth
// pinning down exactly via Google Maps (right-click → coordinates) and
// swapping in, since precise geo helps local-pack/map placement.
const nightClubSchema = {
  "@context": "https://schema.org",
  "@type": "NightClub",
  "@id": `${siteUrl}/#nightclub`,
  name: "Krantas",
  alternateName: ["Krantas Club", "Krantas Klaipėda"],
  description: SITE_DESCRIPTION,
  url: siteUrl,
  telephone: "+37060294076",
  email: "info@krantasclub.lt",
  image: `${siteUrl}/og-image.jpg`,
  logo: `${siteUrl}/logo-round.png`,
  priceRange: "€€",
  currenciesAccepted: "EUR",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Naujoji Uosto g. 3",
    addressLocality: "Klaipėda",
    postalCode: "92120",
    addressCountry: "LT",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 55.7057,
    longitude: 21.1354,
  },
  areaServed: [
    { "@type": "City", name: "Klaipėda" },
    { "@type": "AdministrativeArea", name: "Klaipėdos apskritis" },
  ],
  sameAs: [
    "https://instagram.com/krantas_club",
    "https://www.facebook.com/krantasclub",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "Krantas",
  description: SITE_DESCRIPTION,
  inLanguage: "lt-LT",
  publisher: { "@id": `${siteUrl}/#nightclub` },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Pagrindinis", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "About", item: `${siteUrl}/about` },
    { "@type": "ListItem", position: 3, name: "Events", item: `${siteUrl}/events` },
    { "@type": "ListItem", position: 4, name: "Contact", item: `${siteUrl}/contact` },
  ],
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
  const [episodes, reels, homepageContent] = await Promise.all([
    getRadioEpisodes(),
    getReels(),
    getHomepageContent(),
  ]);
  return (
    <html lang="lt">
      <head>
        {/* Hero poster is set via CSS background-image (not <img>/next/image),
            so the browser can't discover it until CSS is parsed. It's the
            LCP element on the homepage, so preload it explicitly — pointing
            at whichever poster is actually in use (admin-uploaded via
            /admin/homepage, or the bundled default) so an admin-swapped
            hero video doesn't regress load time. */}
        <link
          rel="preload"
          as="image"
          href={homepageContent.heroPosterUrl || "/hero-poster.webp"}
          fetchPriority="high"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(nightClubSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </head>
      <body className={`${anton.variable} ${inter.variable} ${plexMono.variable}`}>
        <SiteChrome initialEpisodes={episodes} initialReels={reels}>{children}</SiteChrome>
      </body>
    </html>
  );
}
