"use client";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useLanguage } from "@/components/LanguageProvider";

export default function AdminPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const sections = [
    {
      group: t("admin.groupSiteContent"),
      items: [
        { href: "/admin/homepage", icon: "▬", label: t("admin.homepageLabel"), desc: t("admin.homepageDesc") },
        { href: "/admin/releases", icon: "◈", label: t("admin.releasesLabel"), desc: t("admin.releasesDesc") },
        { href: "/admin/artists", icon: "♫", label: t("admin.artistsLabel"), desc: t("admin.artistsDesc") },
        { href: "/admin/events", icon: "◆", label: t("admin.eventsLabel"), desc: t("admin.eventsDesc") },
        { href: "/admin/radio", icon: "▶", label: t("admin.radioLabel"), desc: t("admin.radioDesc") },
        { href: "/admin/radio/live", icon: "◉", label: t("admin.radioLiveLabel"), desc: t("admin.radioLiveDesc") },
        { href: "/admin/store", icon: "◫", label: t("admin.storeLabel"), desc: t("admin.storeDesc") },
        { href: "/admin/orders", icon: "✉", label: t("admin.ordersLabel"), desc: t("admin.ordersDesc") },
        { href: "/admin/reels", icon: "❖", label: t("admin.reelsLabel"), desc: t("admin.reelsDesc") },
        { href: "/admin/videos", icon: "▣", label: t("admin.videosLabel"), desc: t("admin.videosDesc") },
        { href: "/admin/gallery", icon: "▤", label: t("admin.galleryLabel"), desc: t("admin.galleryDesc") },
        { href: "/admin/inquiries", icon: "✎", label: t("admin.inquiriesLabel"), desc: t("admin.inquiriesDesc") },
        { href: "/admin/about", icon: "●", label: t("admin.aboutLabel"), desc: t("admin.aboutDesc") },
      ],
    },
    {
      group: t("admin.groupAccount"),
      items: [
        { href: "/admin/login", icon: "⚿", label: t("admin.changeLoginLabel"), desc: t("admin.changeLoginDesc") },
      ],
    },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#0a0c0d] flex items-center justify-center px-6 py-16 font-mono">
      <div className="w-full max-w-[520px]">
        <div className="text-center mb-10">
          <div className="font-display text-5xl text-[#ece7dd] leading-none mb-1.5">KRANTAS</div>
          <div className="text-[10px] tracking-[0.38em] uppercase text-[#9aa19d] mb-3">{t("admin.controlPanel")}</div>
          <div className="flex justify-center">
            <LanguageSwitch />
          </div>
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
            <Link href="/" className="text-[11px] tracking-[0.2em] uppercase text-[#ff8a1e]">{t("admin.backToSite")}</Link>
            <button onClick={handleLogout} className="bg-transparent border-0 cursor-pointer text-[11px] tracking-[0.2em] uppercase text-[#9aa19d] hover:text-[#e5837f] transition-colors">
              {t("admin.signOut")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
