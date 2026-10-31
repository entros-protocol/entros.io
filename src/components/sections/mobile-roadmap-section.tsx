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
    <section className="border-t border-border">
      {/* The site widens max-w-5xl into a layout token, so the pair sets its
          own measure to stay a compact centred unit. */}
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-[68rem] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
              Verify on the go<span className="text-cyan">.</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
              An Entros app for the Solana Seeker is in development.
            </p>

            <ul className="mt-12 flex flex-col gap-7">
              {mobileRoadmapItems.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <li key={item.title} className="flex gap-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground/70" />
                    <div>
                      <h3 className="text-base font-medium text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/55">
                        {item.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex justify-center">
            {/* Solana Mobile's own Seeker render from their public press kit,
              matted off its backdrop so it sits in either theme. The 524px
              export is the 262px slot at 2x DPR at q92, so next/image does
              not soften it with a second q75 encode. */}
            <RiseIn>
              <Image
                src="/images/seeker-device.webp"
                alt="The Solana Seeker phone"
                width={524}
                height={746}
                quality={92}
                className="h-auto w-[220px] sm:w-[250px] lg:w-[280px]"
                sizes="(min-width: 1024px) 280px, 250px"
              />
            </RiseIn>
          </div>
        </div>
      </div>
    </section>
  );
}
