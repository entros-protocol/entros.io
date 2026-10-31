/**
 * The Entros mark: three bars, the middle one stopping short of a cyan
 * block. It is drawn on an 18-unit grid, so at 18 px, or a whole multiple,
 * every edge lands on a whole pixel and stays sharp; at that size it
 * matches the master artwork to within half a pixel. The bars take the
 * text colour, so the mark follows the surface it sits on, and the block
 * keeps the artwork's cyan in both themes.
 */
export function EntrosMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false" className={className}>
      <path fill="currentColor" d="M0 0h18v4H0zM0 7h12v4H0zM0 14h18v4H0z" />
      <path fill="#00E7FE" d="M14 7h4v4h-4z" />
    </svg>
  );
}
