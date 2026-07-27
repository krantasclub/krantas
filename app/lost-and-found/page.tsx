import type { Metadata } from "next";
import LostFoundSection from "@/components/LostFoundSection";

export const metadata: Metadata = {
  title: "Lost & found",
  description: "Left something behind at Krantas? File a lost & found report.",
};

export default function LostAndFoundPage() {
  return (
    <div className="pt-16 sm:pt-20">
      <LostFoundSection />
    </div>
  );
}
