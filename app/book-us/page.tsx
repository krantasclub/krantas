import type { Metadata } from "next";
import BookUsSection from "@/components/BookUsSection";
import { getArtists } from "@/lib/data";

export const metadata: Metadata = {
  title: "Book us",
  description: "Book a DJ set, residency, or hire Krantas for a private event in Klaipėda.",
};

export default async function BookUsPage() {
  const artists = await getArtists();
  return (
    <div className="pt-16 sm:pt-20">
      <BookUsSection artists={artists} />
    </div>
  );
}
