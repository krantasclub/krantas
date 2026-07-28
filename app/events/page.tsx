import type { Metadata } from "next";
import EventsSection from "@/components/EventsSection";
import { getEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Artimiausi vakarėliai ir renginiai klube Krantas, Klaipėdoje — DJ setai, rezidentai, live pasirodymai.",
  keywords: ["renginiai Klaipėda", "vakarėliai Klaipėda", "Krantas renginiai"],
  alternates: { canonical: "/events" },
};

export const revalidate = 60;

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <div className="pt-16 sm:pt-20">
      <EventsSection initialPosters={events} />
    </div>
  );
}
