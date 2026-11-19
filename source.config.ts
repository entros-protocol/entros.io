import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
import { resolveGitLastModified } from "./src/lib/git-last-modified";

export const docs = defineDocs({
  dir: "content/docs",
});

// The default GitHub themes put keywords and comments under 4.5:1 on the
// docs code background. The high-contrast pair keeps the same palette.
export default defineConfig({
  plugins: [
    lastModified({
      versionControl: (filePath) =>
        resolveGitLastModified(filePath, process.cwd()),
    }),
  ],
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "github-light-high-contrast",
        dark: "github-dark-high-contrast",
      },
    },
  },
});
