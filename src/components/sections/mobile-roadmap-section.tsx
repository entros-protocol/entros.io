import Image from "next/image";
import { RiseIn } from "@/components/ui/rise-in";
import { mobileRoadmapItems } from "@/data/mobile-roadmap";
import { getIcon } from "@/lib/icons";

/**
 * Verify on the go: copy and the Seeker as one centred pair, the phone
 * shown whole and lifted into place the first time it scrolls into view.
 */
export function MobileRoadmapSection() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-[68rem] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
              Verify on the go<span className="text-cyan">.</span>
            </h2>
            <p className="mt-6 max-w-[65ch] text-base leading-relaxed text-muted md:text-lg">
              An Entros app for the Solana Seeker is in development.
            </p>

            <ul className="mt-12 flex flex-col gap-7">
              {mobileRoadmapItems.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <li key={item.title} className="flex gap-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground/75" />
                    <div>
                      <h3 className="text-base font-medium text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-muted">
                        {item.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex justify-center">
            <RiseIn>
              <Image
                src="/images/seeker-device.webp"
                alt="The Solana Seeker phone"
                width={524}
                height={746}
                quality={92}
                className="h-auto w-[220px] sm:w-[250px] lg:w-[280px]"
                sizes="(min-width: 1024px) 320px, 320px"
              />
            </RiseIn>
          </div>
        </div>
      </div>
    </section>
  );
}
