import { redirect } from "next/navigation";

// Stats editing now lives inside /admin/about (it only ever showed on the
// About page anyway) — this route just catches old links/bookmarks.
export default function StatsRedirect() {
  redirect("/admin/about");
}
