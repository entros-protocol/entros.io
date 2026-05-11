import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Update when content meaningfully changes site-wide. Per-request `new Date()`
// makes Google ignore lastModified entirely.
const LAST_MODIFIED = "2026-04-26";

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const entries: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/solutions", changeFrequency: "weekly", priority: 0.9 },
  { path: "/technology", changeFrequency: "weekly", priority: 0.9 },
  { path: "/security", changeFrequency: "weekly", priority: 0.9 },
  { path: "/paper", changeFrequency: "monthly", priority: 0.8 },
  { path: "/token", changeFrequency: "monthly", priority: 0.7 },
  { path: "/integrate", changeFrequency: "monthly", priority: 0.8 },
  { path: "/verify", changeFrequency: "weekly", priority: 0.8 },
  { path: "/dashboard", changeFrequency: "weekly", priority: 0.6 },
  { path: "/agents", changeFrequency: "weekly", priority: 0.7 },
  { path: "/governance", changeFrequency: "weekly", priority: 0.7 },
  { path: "/stats", changeFrequency: "weekly", priority: 0.6 },
  { path: "/roadmap", changeFrequency: "monthly", priority: 0.7 },
  { path: "/press", changeFrequency: "monthly", priority: 0.5 },
  { path: "/case-studies/realms", changeFrequency: "monthly", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return entries.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency,
    priority,
  }));
}
