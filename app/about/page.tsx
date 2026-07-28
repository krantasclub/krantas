import type { Metadata } from "next";
import AboutSection from "@/components/AboutSection";
import { getAboutContent, getStats } from "@/lib/data";

const SITE_URL = "https://krantas.lt";

export const metadata: Metadata = {
  title: "About — Underground Music Club in Klaipėda",
  description:
    "The story behind Krantas — underground music in Klaipėda, uosto rajone. Naktinis klubas Klaipėdoje built around residents, techno, breaks and bass since the tide turned.",
  keywords: [
    "underground music Klaipėda",
    "underground klubas Klaipėda",
    "underground scene Klaipėda",
    "techno underground Klaipėda",
    "Krantas klubas Klaipėda",
    "naktinis klubas Klaipėda istorija",
    "apie Krantas",
  ],
  alternates: { canonical: "/about" },
  openGraph: {
    type: "profile",
    locale: "lt_LT",
    url: `${SITE_URL}/about`,
    siteName: "Krantas",
    title: "About — Underground Music Club in Klaipėda",
    description: "The story behind Krantas — underground music by the shore in Klaipėda.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Krantas — underground music Klaipėda" }],
  },
};

// Ties this page to the NightClub entity from the root layout and gives
// Google an explicit "this page is about the club's story" signal —
// stronger for the "underground music Klaipėda" phrase than a standalone
// page would be, without duplicating the homepage.
const aboutPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Krantas — Underground Music Club in Klaipėda",
  url: `${SITE_URL}/about`,
  about: { "@id": `${SITE_URL}/#nightclub` },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Pagrindinis", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` },
    ],
  },
};

export const revalidate = 60;

export default async function AboutPage() {
  const [about, stats] = await Promise.all([getAboutContent(), getStats()]);
  return (
    <div className="pt-16 sm:pt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }} />
      <AboutSection content={about} stats={stats} />
    </div>
  );
}
