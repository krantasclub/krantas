import type { Metadata } from "next";
import AboutSection from "@/components/AboutSection";
import { getAboutContent, getStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description:
    "Apie Krantas — naktinį klubą Klaipėdoje, uosto rajone. Underground music by the shore since the tide turned, built around residents and immersive sound.",
  keywords: ["Krantas klubas Klaipėda", "naktinis klubas Klaipėda istorija", "apie Krantas"],
  alternates: { canonical: "/about" },
};

export const revalidate = 60;

export default async function AboutPage() {
  const [about, stats] = await Promise.all([getAboutContent(), getStats()]);
  return (
    <div className="pt-16 sm:pt-20">
      <AboutSection content={about} stats={stats} />
    </div>
  );
}
