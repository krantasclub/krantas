import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ArtistsSection from "@/components/ArtistsSection";
import ArtistsGrid from "@/components/ArtistsGrid";
import { getArtists, getHomepageContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "Artists",
  description: "Artists and residents on Krantas.",
  alternates: { canonical: "/artists" },
};

export const revalidate = 60;

export default async function ArtistsPage() {
  const homepageContent = await getHomepageContent();
  // Toggled off from /admin/homepage — the direct URL shouldn't keep
  // working just because it's no longer linked from the header.
  if (homepageContent.hideArtists) redirect("/");

  // Fetched once here and handed to both sections below — the old version
  // had each section run its own identical client-side fetch.
  const artists = await getArtists();
  return (
    <div className="pt-16 sm:pt-20">
      <ArtistsSection initialRoster={artists} />
      <ArtistsGrid initialRoster={artists} />
    </div>
  );
}
