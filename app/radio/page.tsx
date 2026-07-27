import type { Metadata } from "next";
import RadioSection from "@/components/RadioSection";
import { getRadioData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Radio",
  description: "Krantas Radio — new transmissions every second week.",
};

// Live on-air status still polls client-side every 30s (see RadioSection),
// so a short revalidate window here just keeps episodes/schedule/links
// reasonably fresh without refetching on every single request.
export const revalidate = 30;

export default async function RadioPage() {
  const radio = await getRadioData();
  return (
    <div className="pt-16 sm:pt-20">
      <RadioSection initialData={radio} />
    </div>
  );
}
