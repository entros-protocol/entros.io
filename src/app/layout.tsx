import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SiteChrome } from "@/components/layout/site-chrome";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { StructuredData } from "@/components/seo/structured-data";
import {
  buildOgImageUrl,
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
  OG_DEFAULT_TITLE,
} from "@/lib/og-card";
import {
  BRAND_COLOR_DARK,
  BRAND_COLOR_LIGHT,
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

// Geist carries the display headlines; body copy uses Inter.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

// Wordmark uses JetBrains Mono — same family as the body monospace,
// kept as a separate CSS variable so the wordmark surface can be
// swapped independently in the future without touching components.
const wordmark = JetBrains_Mono({
  variable: "--font-wordmark",
  subsets: ["latin"],
  weight: "500",
  display: "swap",
});

const ROOT_TITLE = `${OG_DEFAULT_TITLE} | ${SITE_NAME}`;
const ROOT_DESCRIPTION =
  "Private human verification. Verify your wallet in three short rounds. Raw motion and touch stay on your device.";
const SOCIAL_DESCRIPTION =
  "Private human verification. Three short rounds put an Entros Anchor on your wallet, and any Solana app can read it for free.";
const ROOT_OG_IMAGE_URL = buildOgImageUrl("/");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: ROOT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: ROOT_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: ROOT_TITLE,
    description: SOCIAL_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: ROOT_OG_IMAGE_URL,
        width: OG_CARD_WIDTH,
        height: OG_CARD_HEIGHT,
        alt: ROOT_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: ROOT_TITLE,
    description: SOCIAL_DESCRIPTION,
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    images: [ROOT_OG_IMAGE_URL],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: BRAND_COLOR_DARK },
    { media: "(prefers-color-scheme: light)", color: BRAND_COLOR_LIGHT },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${geist.variable} ${wordmark.variable} overflow-x-hidden`}
      suppressHydrationWarning
    >
      <body className="min-h-[100svh] overflow-x-clip bg-background text-foreground font-sans antialiased">
        <StructuredData />
        <ThemeProvider>
          <SiteChrome navbar={<Navbar />} footer={<Footer />}>
            {children}
          </SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
