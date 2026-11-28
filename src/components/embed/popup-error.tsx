/**
 * Opaque error surface for the popup.
 *
 * Server component. Surfaces a single generic message regardless of
 * the underlying rejection reason. Specific reasons stay server-side.
 */
export function PopupError() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <p className="font-mono text-xs font-medium text-danger">
        Error
      </p>
      <h1 className="mt-4 font-display text-lg font-normal text-foreground/80">
        This integration is not authorized.
      </h1>
    </div>
  );
}
