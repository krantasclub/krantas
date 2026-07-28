import type { Metadata } from "next";
import ContactSection from "@/components/ContactSection";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Susisiekite su Krantas — naktiniu klubu Klaipėdoje, Naujoji Uosto g. 3. Klausimai, žiniasklaida, svečių sąrašai.",
  keywords: ["Krantas Klaipėda adresas", "kontaktai naktinis klubas Klaipėda"],
  alternates: { canonical: "/contact" },
};

// ContactPage schema ties this specific page to the NightClub entity
// defined in the root layout, and gives Google an explicit ContactPoint —
// helps local-intent queries surface the right page, not just the domain.
const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact — Krantas",
  url: "https://krantas.lt/contact",
  about: { "@id": "https://krantas.lt/#nightclub" },
  mainEntity: {
    "@type": "NightClub",
    "@id": "https://krantas.lt/#nightclub",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+37060294076",
      email: "info@krantasclub.lt",
      contactType: "customer service",
      areaServed: "LT",
      availableLanguage: ["lt", "en"],
    },
  },
};

export default function ContactPage() {
  return (
    <div className="pt-16 sm:pt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }} />
      <ContactSection />
    </div>
  );
}
