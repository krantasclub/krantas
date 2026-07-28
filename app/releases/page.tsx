import type { Metadata } from "next";
import ReleasesSection from "@/components/ReleasesSection";
import { getReleases } from "@/lib/data";

export const metadata: Metadata = {
  title: "Releases",
  description: "Releases on Krantas Recordings.",
  alternates: { canonical: "/releases" },
};

// Revalidate periodically so admin edits show up without needing a full
// redeploy, while still being fetched server-side (no client-side fallback
// flash on load or navigation).
export const revalidate = 60;

export default async function ReleasesPage() {
  const releases = await getReleases();
  return (
    <div className="pt-16 sm:pt-20">
      <ReleasesSection initialItems={releases} />
    </div>
  );
}
