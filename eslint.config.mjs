import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated output. Both are gitignored, and linting them reports
    // thousands of problems in minified bundles and generated modules.
    ".vercel/**",
    ".source/**",
  ]),
  {
    rules: {
      // `// SECTION LABEL` inside a JSX span is the site's terminal-style
      // section heading, specified in the frontend constitution and used in
      // 79 files. The rule exists to catch a `//` comment written by mistake
      // in JSX, which is not what these are.
      "react/jsx-no-comment-textnodes": "off",
      // Fires on a raw apostrophe in JSX copy, which React renders correctly.
      // Enforcing it would mean rewriting thirty user-visible strings as HTML
      // entities for no behavioural gain.
      "react/no-unescaped-entities": "off",
      // Render-cost advisories from the React Compiler rules. Each instance has
      // been reviewed and is scheduled rather than outstanding. Kept at "warn"
      // so they stay visible in output instead of being switched off.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
