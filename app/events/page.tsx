import type { Metadata } from "next";
import EventsSection from "@/components/EventsSection";
import { getEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming events at Krantas, Klaipėda.",
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
