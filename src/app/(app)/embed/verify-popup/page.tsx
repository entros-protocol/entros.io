import { isAllowedIntegrator } from "@/lib/embed/integrator-allowlist";
import { parseEmbedParams } from "@/lib/embed/url-params";
import { PopupContent } from "@/components/embed/popup-content";
import { PopupError } from "@/components/embed/popup-error";
import { PopupShell } from "@/components/embed/popup-shell";

/**
 * Embed/verify-popup route — server component entry point.
 *
 * Validation order:
 *   1. URL parameters parse cleanly.
 *   2. (integratorKey, parentOrigin) is on the env-driven allowlist
 *      (or, in dev mode, parentOrigin is on localhost).
 *
 * Failure at either step renders the same opaque error surface. Specific
 * rejection reasons stay server-side.
 */
export default async function EmbedVerifyPopupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;

  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") usp.set(key, value);
    else if (Array.isArray(value)) {
      for (const entry of value) usp.append(key, entry);
    }
  }

  const parsed = parseEmbedParams(usp);

  if (!parsed.ok) {
    return (
      <PopupShell>
        <PopupError />
      </PopupShell>
    );
  }

  const allowed = isAllowedIntegrator(
    parsed.params.integratorKey,
    parsed.params.parentOrigin,
  );

  if (!allowed) {
    return (
      <PopupShell>
        <PopupError />
      </PopupShell>
    );
  }

  return (
    <PopupShell>
      <PopupContent params={parsed.params} />
    </PopupShell>
  );
}
