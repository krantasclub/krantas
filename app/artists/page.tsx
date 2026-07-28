import type { Metadata } from "next";
import ArtistsSection from "@/components/ArtistsSection";
import ArtistsGrid from "@/components/ArtistsGrid";
import { getArtists } from "@/lib/data";

export const metadata: Metadata = {
  title: "Artists",
  description: "Artists and residents on Krantas.",
  alternates: { canonical: "/artists" },
};

export const revalidate = 60;

export default async function ArtistsPage() {
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
