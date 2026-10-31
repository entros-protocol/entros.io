import type { MetadataRoute } from "next";
import { BRAND_COLOR_DARK, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Entros",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: BRAND_COLOR_DARK,
    theme_color: BRAND_COLOR_DARK,
    icons: [
      { src: "/favicons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { src: "/favicons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/favicons/icon-48x48.png", sizes: "48x48", type: "image/png" },
      {
        src: "/favicons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // The mark sits inside the central safe circle on a full-bleed
      // tile, so the same file can be cropped to any launcher shape.
      {
        src: "/favicons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
