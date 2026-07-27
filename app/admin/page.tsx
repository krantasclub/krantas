"use client";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const sections = [
  {
    group: "Site content",
    items: [
      { href: "/admin/releases", icon: "◈", label: "Releases", desc: "Label discography, cover art and tracklists" },
      { href: "/admin/artists", icon: "♫", label: "Artists", desc: "Roster shown on the homepage and Artists page" },
      { href: "/admin/events", icon: "◆", label: "Events", desc: "Featured, upcoming and past line-up" },
      { href: "/admin/radio", icon: "▶", label: "Radio", desc: "Upload tracks for the Radio page and header play button" },
      { href: "/admin/radio/live", icon: "◉", label: "Radio — live desk", desc: "On-air toggle, now playing, stream link, schedule and listen links" },
      { href: "/admin/store", icon: "◫", label: "Store", desc: "Products shown on the Store page" },
      { href: "/admin/orders", icon: "✉", label: "Orders", desc: "Orders placed through the Store page" },
      { href: "/admin/reels", icon: "❖", label: "Reels", desc: "Upload clips or paste Facebook/other reel links for the sticky Reels tab" },
      { href: "/admin/videos", icon: "▣", label: "Videos", desc: "Upload sets or paste YouTube/other links, tag by artist and genre" },
      { href: "/admin/gallery", icon: "▤", label: "Gallery", desc: "Venue photo strip on the homepage — upload, reorder, alt text" },
      { href: "/admin/inquiries", icon: "✎", label: "Inquiries", desc: "Submissions from Contact, Book us and Lost & found" },
      { href: "/admin/about", icon: "●", label: "About", desc: "Story, heading, photo and the stats strip on the About page" },
    ],
  },
  {
    group: "Account",
    items: [
      { href: "/admin/login", icon: "⚿", label: "Change login", desc: "Manage this from the Supabase dashboard" },
    ],
  },
];

export default function AdminPage() {
  const router = useRouter();
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#0a0c0d] flex items-center justify-center px-6 py-16 font-mono">
      <div className="w-full max-w-[520px]">
        <div className="text-center mb-10">
          <div className="font-display text-5xl text-[#ece7dd] leading-none mb-1.5">KRANTAS</div>
          <div className="text-[10px] tracking-[0.38em] uppercase text-[#9aa19d]">Control Panel</div>
        </div>

        <div className="bg-[#12181a] border border-[rgba(236,231,221,0.14)]">
          {sections.map((section, si) => (
            <div key={section.group}>
              {si > 0 && <div className="h-px bg-[rgba(236,231,221,0.14)] mx-7" />}
              <div className="px-7 pt-6 pb-3">
                <div className="text-[10px] tracking-[0.38em] uppercase text-[#ff8a1e] mb-3">{section.group}</div>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 py-3 border-b border-[rgba(236,231,221,0.14)] text-[#ece7dd] no-underline transition-opacity hover:opacity-60"
                  >
                    <span className="font-display text-xl text-[#ff8a1e] w-6 text-center shrink-0">{item.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs tracking-[0.18em] uppercase font-medium mb-0.5">{item.label}</div>
                      <div className="text-[13px] text-[#9aa19d]">{item.desc}</div>
                    </div>
                    <span className="text-[#9aa19d] text-base">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="px-7 py-5 flex items-center justify-between">
            <Link href="/" className="text-[11px] tracking-[0.2em] uppercase text-[#ff8a1e]">← Site</Link>
            <button onClick={handleLogout} className="bg-transparent border-0 cursor-pointer text-[11px] tracking-[0.2em] uppercase text-[#9aa19d] hover:text-[#e5837f] transition-colors">
              Sign out →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
