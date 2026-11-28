import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { EntrosMark } from "@/components/layout/entros-mark";
import { GithubMark } from "@/components/layout/github-mark";

export function baseOptions(): BaseLayoutProps {
  return {
    themeSwitch: {
      enabled: false,
    },
    nav: {
      title: (
        <span
          style={{
            fontFamily:
              "var(--font-wordmark), 'JetBrains Mono', ui-monospace, monospace",
          }}
          className="inline-flex items-center text-base font-medium tracking-tight text-foreground"
        >
          <EntrosMark className="mr-1.5 size-[18px] shrink-0" />
          <span className="[text-box:trim-both_cap_alphabetic]">Entros</span>
          <span className="ml-1.5 font-sans text-xs font-medium text-muted">
            Docs
          </span>
        </span>
      ),
      url: "/docs",
    },
    links: [
      { text: "Site", url: "/", active: "url" },
      { text: "Security", url: "/security", active: "url" },
      { text: "Roadmap", url: "/roadmap", active: "url" },
      // Explicit labelled icon link instead of `githubUrl`'s unlabelled built-in svg.
      {
        type: "icon",
        url: "https://github.com/entros-protocol",
        text: "GitHub",
        label: "GitHub",
        icon: <GithubMark className="size-5" />,
      },
    ],
  };
}
