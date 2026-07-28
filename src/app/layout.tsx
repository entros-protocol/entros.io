import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SiteChrome } from "@/components/layout/site-chrome";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { StructuredData } from "@/components/seo/structured-data";
import {
  BRAND_COLOR_DARK,
  BRAND_COLOR_LIGHT,
  OG_IMAGE_PATH,
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

const ROOT_TITLE = `${SITE_NAME}—Proof of Personhood on Solana`;
const ROOT_DESCRIPTION =
  "Twelve seconds of behavioral liveness—voice, motion, and touch—anchored on chain. Read by every Solana dApp. Bind your agent, build your Trust Score. No raw biometrics, ever.";
const SOCIAL_DESCRIPTION =
  "Twelve seconds of behavioral liveness on Solana, private, anchored on chain, read by every dApp. Bind your agent, build your Trust Score.";

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
        url: OG_IMAGE_PATH,
        width: 500,
        height: 500,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    // Use the small-square "summary" card layout instead of
    // "summary_large_image" so every path on the site renders the same
    // compact card (square logo on the left, title + description on the
    // right). The wide hero card was inconsistent with how child paths
    // (/verify, /docs, etc.) rendered without their own twitter:image,
    // and squeezed the logo into a 4:3 box that looked broken.
    card: "summary",
    title: ROOT_TITLE,
    description: SOCIAL_DESCRIPTION,
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    images: [OG_IMAGE_PATH],
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
