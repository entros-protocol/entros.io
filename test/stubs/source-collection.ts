/**
 * Stand-in for the `@/.source` collection that `fumadocs-mdx` generates.
 *
 * The real module compiles every MDX file, which needs the fumadocs Vite
 * plugin. That plugin also rewrites `.source/` on every run, so wiring it into
 * Vitest would break a `next dev` server running beside the tests. The loader,
 * the page tree, and URL generation are all real here. Only the MDX bodies are
 * absent, and no test reads one.
 */
export const docs = {
  toFumadocsSource() {
    return {
      files: [
        {
          type: "page" as const,
          path: "index.mdx",
          data: { title: "Entros Developer Docs", description: "Stub index." },
        },
        {
          type: "page" as const,
          path: "concepts/trust-score.mdx",
          data: { title: "Trust Score", description: "Stub concept page." },
        },
      ],
    };
  },
};
