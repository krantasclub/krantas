import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import ArtistsSection from "@/components/ArtistsSection";
import VideosSection from "@/components/VideosSection";
import StatementSection from "@/components/StatementSection";
import GallerySection from "@/components/GallerySection";
import PartnersRevealSection from "@/components/PartnersRevealSection";
import LocationSection from "@/components/LocationSection";
import { getArtists, getVideos, getGalleryImages, getHomepageContent } from "@/lib/data";

export const revalidate = 60;

// Home page — Releases / Events / Radio / Store still live on their
// own routes (see app/releases, app/events, app/radio, app/store),
// same as visionrecordings.nl. Artists, filmed sets, the venue
// gallery and the location finder live on the homepage as well.
//
// Section order is deliberately alternating raised/plain background
// so the page has pacing instead of one long run of carousels:
// Artists (raised) → Videos (plain) → Statement (raised, text-only,
// parallax) → Gallery (plain) → Partners (raised, image reveal,
// scroll-pinned) → Location (plain).
//
// Reels used to sit here as its own card-grid section, but that put
// two grids back to back (Gallery → Reels) and broke the rhythm.
// They now live behind the sticky "Reels" tab on the right edge of
// the viewport (see ReelsTab in the root layout) instead of taking a
// slot in the scroll.
export default async function Home() {
  const [artists, videos, galleryImages, homepageContent] = await Promise.all([
    getArtists(),
    getVideos(),
    getGalleryImages(),
    getHomepageContent(),
  ]);
  return (
    <>
      <Hero
        videoUrl={homepageContent.heroVideoUrl}
        videoType={homepageContent.heroVideoType}
        posterUrl={homepageContent.heroPosterUrl}
      />
      <Marquee text={homepageContent.marqueeText} />
      {!homepageContent.hideArtists && <ArtistsSection initialRoster={artists} />}
      <VideosSection initialItems={videos} />
      <StatementSection
        eyebrow={homepageContent.statementEyebrow}
        heading={homepageContent.statementHeading}
        body={homepageContent.statementBody}
      />
      <GallerySection initialImages={galleryImages} />
      <PartnersRevealSection />
      <LocationSection />
    </>
  );
}
