import type { Metadata } from "next";
import BookUsSection from "@/components/BookUsSection";
import { getArtists, getHomepageContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "Book us",
  description: "Book a DJ set, residency, or hire Krantas for a private event in Klaipėda.",
  alternates: { canonical: "/book-us" },
};

export default async function BookUsPage() {
  const [artists, homepageContent] = await Promise.all([getArtists(), getHomepageContent()]);
  // Toggled off from /admin/homepage — BookUsSection already leaves the
  // "Which artist" picker off the form whenever artists is empty.
  return (
    <div className="pt-16 sm:pt-20">
      <BookUsSection artists={homepageContent.hideArtists ? [] : artists} />
    </div>
  );
}
