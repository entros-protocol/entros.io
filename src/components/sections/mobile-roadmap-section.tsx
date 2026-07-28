import Image from "next/image";
import { mobileRoadmapItems } from "@/data/mobile-roadmap";
import { getIcon } from "@/lib/icons";

/**
 * Coming to Mobile—same shape as the temporal-consistency section: the
 * device render and the copy read as one centred unit above three
 * feature cells. Below lg the phone floats right so the copy runs down
 * the left and wraps around it; at lg the row is a flex container, the
 * float stops applying, and the phone moves to the left of the copy.
 */
export function MobileRoadmapSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="after:table after:clear-both lg:flex lg:items-center lg:justify-center lg:gap-16 lg:after:hidden">
          {/* Solana Mobile's own Seeker product render, from their public
              press kit, matted off its backdrop so the device sits on the
              page in either theme. The backdrop is a pure vertical
              gradient, so it can be modelled per row from the side strips;
              alpha is then the blend fraction of each pixel against that
              model, which lands the contour on the true 50% crossing at
              any contrast. Thresholding the raw difference instead snaps
              the edge hard and leaves a teal fringe along the bottom,
              where the dark body meets the bright end of the gradient. */}
          <div className="relative float-right ml-5 w-[100px] sm:ml-8 sm:w-[140px] md:w-[165px] lg:float-none lg:ml-0 lg:w-[240px] lg:shrink-0 xl:w-[262px]">
            {/* Exported at 524px — exactly the 262px slot at 2x DPR — and
                resampled there from the 4x solve in premultiplied space, so
                the antialiasing is done once by a Lanczos filter instead of
                twice by whatever the browser reaches for. next/image would
                otherwise re-encode at its default q75 on top of that, and
                that second pass is what softened the device. */}
            <Image
              src="/images/seeker-device.webp"
              alt="The Solana Seeker phone"
              width={524}
              height={746}
              quality={92}
              className="h-auto w-full"
              sizes="(min-width: 1024px) 262px, (min-width: 640px) 165px, 100px"
            />
          </div>

          <div className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
              // COMING TO MOBILE
            </span>

            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
              Verify on the go<span className="text-cyan">.</span>
            </h2>

            <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
              A Solana Mobile app is in development for the Solana dApp
              Store, targeting Seeker. Native sensor APIs extend the
              biometric surface, and Trust Score carries across every
              dApp in the mobile ecosystem.
            </p>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
          {mobileRoadmapItems.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={item.title} className="bg-background p-8">
                <Icon className="h-6 w-6 text-cyan" strokeWidth={1.5} />
                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  {item.description}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  {item.benefit}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
