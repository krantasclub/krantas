"use client";

import { usePathname } from "next/navigation";
import type { RadioEpisode, Reel } from "@/lib/content";
import Nav from "./Nav";
import Footer from "./Footer";
import ReelsTab from "./ReelsTab";

// The control panel (/admin/**) is its own fixed-position layout and
// doesn't want the public site's fixed header, footer or reels tab —
// they were rendering on top of/behind admin content since Nav is
// `position: fixed` and admin pages don't reserve space for it.
export default function SiteChrome({
  children,
  initialEpisodes,
  initialReels,
  hideArtists,
}: {
  children: React.ReactNode;
  initialEpisodes?: RadioEpisode[];
  initialReels?: Reel[];
  hideArtists?: boolean;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Nav initialEpisodes={initialEpisodes} hideArtists={hideArtists} />
      <main>{children}</main>
      <Footer />
      <ReelsTab initialReels={initialReels} />
    </>
  );
}
