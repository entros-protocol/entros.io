import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify with Entros",
  description:
    "Verify a connected Solana wallet on devnet through three short rounds.",
  alternates: {
    canonical: null,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
