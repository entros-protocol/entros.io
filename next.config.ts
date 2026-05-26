import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

// Origins surveyed from src/ — every external URL the site actually hits.
// Adding to this list requires understanding which network call needs it.
function buildConnectSrc(): string {
  const origins = new Set<string>([
    "'self'",
    // Solana RPC (devnet default + mainnet for forward-compat). The
    // env-set RPC URL is added below; these are the fallback origins
    // from `clusterApiUrl()` + direct `new Connection(...)` call sites.
    "https://api.devnet.solana.com",
    "wss://api.devnet.solana.com",
    "https://api.mainnet-beta.solana.com",
    "wss://api.mainnet-beta.solana.com",
    // Agent registry indexer (8004) — used by /api/agents route on the
    // server side, but listed here so client-side fetches stay portable.
    "https://8004-indexer-main.qnt.sh",
    "https://8004-indexer-dev.qnt.sh",
  ]);

  // Pull deployment-specific URLs from env so hosted preview builds don't
  // need a code change to whitelist their relayer / RPC override.
  const envOrigins = [
    process.env.NEXT_PUBLIC_RELAYER_URL,
    process.env.NEXT_PUBLIC_SOLANA_RPC,
    process.env.NEXT_PUBLIC_WASM_URL,
    process.env.NEXT_PUBLIC_ZKEY_URL,
  ];
  for (const value of envOrigins) {
    if (!value) continue;
    try {
      const url = new URL(value);
      origins.add(`${url.protocol}//${url.host}`);
      // Allow the websocket variant of an HTTPS RPC endpoint (Anchor's
      // Connection opens a `wss://` subscription on the same host).
      if (url.protocol === "https:") {
        origins.add(`wss://${url.host}`);
      }
    } catch {
      // Not a valid URL; silently skip rather than crash the build.
    }
  }

  return [...origins].join(" ");
}

// Keep the policy as a single string so the Next.js headers pipeline
// emits exactly one Content-Security-Policy header.
function buildCSP(): string {
  const directives = [
    `default-src 'self'`,
    // wasm-unsafe-eval is required for snarkjs proof generation
    // (WebAssembly.compile + WebAssembly.instantiate). 'unsafe-inline'
    // covers Next.js's hydration boot scripts; nonce-based CSP would
    // force every page to dynamic rendering, which is the wrong tradeoff
    // for this mostly-static marketing site.
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`,
    // Tailwind + framer-motion emit inline style attributes; nonce
    // approach has the same SSR cost as scripts above.
    `style-src 'self' 'unsafe-inline'`,
    // `https:` is intentionally permissive to cover partner logos hosted
    // on github.com, avatar URLs, etc. without enumerating every host.
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src ${buildConnectSrc()}`,
    // snarkjs may run proof generation in a Web Worker depending on
    // build target; allowing blob: covers the dynamically-created worker.
    `worker-src 'self' blob:`,
    // Replaces X-Frame-Options DENY (modern browsers prefer CSP).
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join("; ");
}

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: buildCSP() },
  // 2-year HSTS with subdomain inclusion + preload-list eligibility.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // microphone=(self) is REQUIRED — verification captures audio.
  // Everything else off by default; relax per-feature if a use case appears.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(self), geolocation=(), payment=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  // Force Vercel's per-route output tracing to include the OG logo file
  // in every lambda bundle. The metadata pipeline imports `lib/og.tsx`
  // (transitively, via Next.js metadata-route discovery on
  // `app/opengraph-image.tsx` + `app/twitter-image.tsx`), and that module
  // readFileSyncs the PNG. Without this directive Vercel's tracer drops
  // the file from dynamic-route lambdas, which then throw ENOENT on first
  // request — cf. /embed/verify-popup, the only ƒ route in this build.
  outputFileTracingIncludes: {
    "/**/*": ["./public/logos/Entros.png"],
    // The dynamic OG image route at /api/og/anchor fetches its TTF font
    // files via `fetch(new URL("./_fonts/...", import.meta.url))`. Vercel's
    // route-asset tracer drops these unless we pin them explicitly — same
    // trap as the logos PNG above.
    "/api/og/anchor": [
      "./src/app/api/og/anchor/_fonts/Geist-Regular.ttf",
      "./src/app/api/og/anchor/_fonts/JetBrainsMono-Regular.ttf",
    ],
  },
  turbopack: {
    resolveAlias: {
      fs: { browser: "./src/lib/empty-module.ts" },
      path: { browser: "./src/lib/empty-module.ts" },
      crypto: { browser: "./src/lib/empty-module.ts" },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  async headers() {
    // Dev mode skips CSP and the rest of the hardening headers. Next.js
    // Fast Refresh + Turbopack chunk loading rely on eval() and dynamic
    // blob/CSS chunk URLs that a strict CSP blocks; HSTS would also force
    // HTTPS on localhost. These headers are production hardening — apply
    // them only when actually serving production traffic.
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
