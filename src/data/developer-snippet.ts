import type { DeveloperSnippet } from "./types";

/**
 * Homepage hero snippet — leads with `@entros/verify`, the drop-in
 * trigger component. The five lines in the snippet are the five lines
 * an integrator literally writes; nothing is hidden behind unshown
 * function wrappers, no top-level await, no fake API surface. Copy-paste
 * compiles into a working button.
 */
export const sdkSnippet: DeveloperSnippet = {
  language: "tsx",
  title: "5 lines to request verification",
  code: `import { EntrosVerify } from '@entros/verify';

<EntrosVerify
  integratorKey="my-app"
  onVerified={(result) => console.log(result)}
/>`,
  installCommand: "npm install @entros/verify@0.2.0",
};
