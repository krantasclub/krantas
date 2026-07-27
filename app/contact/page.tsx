import type { Metadata } from "next";
import ContactSection from "@/components/ContactSection";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Krantas, Klaipėda — questions, press, guest lists.",
};

export default function ContactPage() {
  return (
    <div className="pt-16 sm:pt-20">
      <ContactSection />
    </div>
  );
}
