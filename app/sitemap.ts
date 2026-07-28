import type { MetadataRoute } from "next";

const siteUrl = "https://krantas.lt";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/events", priority: 0.9, changeFrequency: "weekly" },
    { path: "/about", priority: 0.9, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.9, changeFrequency: "yearly" },
    { path: "/releases", priority: 0.8, changeFrequency: "monthly" },
    { path: "/artists", priority: 0.8, changeFrequency: "monthly" },
    { path: "/radio", priority: 0.7, changeFrequency: "weekly" },
    { path: "/store", priority: 0.7, changeFrequency: "weekly" },
    { path: "/book-us", priority: 0.6, changeFrequency: "monthly" },
    { path: "/lost-and-found", priority: 0.5, changeFrequency: "monthly" },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
