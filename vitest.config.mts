import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Ordered, because Vite matches string aliases by prefix and takes the
    // first hit. A bare "@" would rewrite "@/.source" to "src/.source", which
    // does not exist. Mirrors the two paths in tsconfig.json.
    alias: [
      {
        find: "@/.source",
        replacement: fileURLToPath(
          new URL("./test/stubs/source-collection", import.meta.url),
        ),
      },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      {
        find: /^server-only$/,
        replacement: fileURLToPath(new URL("./test/stubs/server-only", import.meta.url)),
      },
    ],
  },
});
