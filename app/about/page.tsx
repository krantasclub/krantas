import type { Metadata } from "next";
import AboutSection from "@/components/AboutSection";
import { getAboutContent, getStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Krantas — underground music by the shore in Klaipėda.",
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
