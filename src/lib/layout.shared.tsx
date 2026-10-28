import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { GithubMark } from "@/components/layout/github-mark";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="font-mono text-base tracking-tight text-foreground">
          Entros<span className="text-cyan">_</span>docs
        </span>
      ),
      url: "/docs",
    },
    links: [
      { text: "Site", url: "/", active: "url" },
      { text: "Verify", url: "/verify", active: "url" },
      { text: "Paper", url: "/paper", active: "url" },
      // In place of `githubUrl`, whose built-in icon is an unlabelled
      // role="img" svg inside the link.
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
