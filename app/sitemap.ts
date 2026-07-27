import type { MetadataRoute } from "next";

const siteUrl = "https://krantas.lt";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/releases",
    "/artists",
    "/events",
    "/radio",
    "/store",
    "/contact",
    "/book-us",
    "/lost-and-found",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
