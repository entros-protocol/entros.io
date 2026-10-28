import {
  AsciiCircuitScene,
  AsciiRelayScene,
  AsciiSDKScene,
  AsciiShieldScene,
  AsciiTriadScene,
} from "@/components/ui/ascii-scenes";
import { protocolComponents } from "@/data/protocol-components";

const SCENES = [
  AsciiSDKScene,
  AsciiCircuitScene,
  AsciiTriadScene,
  AsciiRelayScene,
  AsciiShieldScene,
];

/**
 * Protocol Components—five layers, one row each. ASCII scene on one
 * side, copy on the other; alternates per row so the eye walks down
 * the page in a zigzag. Numbered (01–05) for ordering.
 */
export function ProtocolComponentsSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Five layers, one proof<span className="text-cyan">.</span>
        </h2>

        <div className="mt-20 flex flex-col gap-20 md:gap-28">
          {protocolComponents.map((component, idx) => {
            const number = String(idx + 1).padStart(2, "0");
            const reverse = idx % 2 === 1;
            const Scene = SCENES[idx] ?? AsciiSDKScene;
            return (
              <div
                key={component.title}
                className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                  reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <Scene
                  aspect="4/3"
                  className="lg:aspect-[5/4]"
                />

                {/* Copy side */}
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs tracking-[0.2em] text-cyan">
                      {number}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <h3 className="mt-6 font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl md:leading-[1.05]">
                    {component.title}
                  </h3>
                  <p className="text-sm font-medium mt-2 text-foreground">
                    {component.subtitle}
                  </p>
                  <p className="mt-5 text-base leading-relaxed text-foreground/65">
                    {component.description}
                  </p>
                  <ul className="mt-6 space-y-2">
                    {component.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2 text-sm text-foreground/55"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 bg-cyan" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  {component.links && component.links.length > 0 && (
                    <div className="mt-6 flex gap-5 border-t border-border pt-5">
                      {component.links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-foreground/70 transition-colors hover:text-foreground"
                        >
                          {link.label}
                          <span className="text-xs" aria-hidden="true">
                            ↗
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
