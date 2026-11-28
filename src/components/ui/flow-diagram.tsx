import type { ComponentType } from "react";
import type { GlyphProps } from "@/components/icons/glyphs";

interface FlowNode {
  label: string;
  Icon: ComponentType<GlyphProps>;
}

interface FlowDiagramProps {
  from: FlowNode;
  to: FlowNode;
  /** What travels between the two nodes, shown on the line. */
  signal: string;
  /** Properties of the exchange, each with its own glyph. */
  properties: FlowNode[];
}

function Node({ node }: { node: FlowNode }) {
  const { Icon } = node;
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-4 sm:w-24">
      <div className="flex h-16 w-16 items-center justify-center border border-foreground/15 bg-background sm:h-20 sm:w-20">
        <Icon className="h-8 w-8 text-foreground/80 sm:h-9 sm:w-9" />
      </div>
      <span className="text-sm font-medium text-foreground/85">{node.label}</span>
    </div>
  );
}

/**
 * Two square nodes joined by a hairline. A cyan pulse travels the line
 * from the first node to the second, and the thing it carries sits in a
 * tag on the line. Properties of the exchange run along the bottom.
 */
export function FlowDiagram({ from, to, signal, properties }: FlowDiagramProps) {
  return (
    <figure className="flex h-full flex-col bg-surface forced-colors:border forced-colors:border-[CanvasText]">
      <figcaption className="sr-only">
        {from.label} sends {signal} to {to.label}. {properties.map((p) => p.label).join(". ")}.
      </figcaption>

      {/* On a phone the line is too short to carry the tag, so the tag sits above the row. */}
      <div aria-hidden className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 md:py-20">
        <p className="mb-6 text-center font-mono text-xs text-foreground/85 sm:hidden">{signal}</p>
        <div className="flex items-center">
          <Node node={from} />

          <div className="relative mx-2 mb-9 flex-1 sm:mx-4">
            <div className="relative h-px overflow-hidden bg-foreground/20">
              <span className="absolute inset-y-0 left-0 w-1/3 bg-cyan" />
            </div>
            <span className="absolute -right-px top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-foreground/45" />
            <span className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 bg-background sm:block">
              <span className="block whitespace-nowrap bg-background px-3 py-1.5 font-mono text-xs text-foreground/90 forced-colors:border forced-colors:border-[CanvasText]">
                {signal}
              </span>
            </span>
          </div>

          <Node node={to} />
        </div>
      </div>

      {/* Three columns leave a phone about 70px per label, so the strip stacks below `sm`. */}
      <ul className="grid grid-cols-1 border-t border-foreground/10 sm:grid-cols-3">
        {properties.map(({ label, Icon }, index) => (
          <li
            key={label}
            className={`flex items-center justify-center gap-2.5 px-2 py-4 sm:py-5 ${
              index > 0 ? "border-t border-foreground/10 sm:border-l sm:border-t-0" : ""
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 text-foreground/70" />
            <span className="whitespace-nowrap text-sm font-medium text-foreground/85">{label}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
