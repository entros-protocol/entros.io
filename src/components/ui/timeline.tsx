"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

interface TimelineEntry {
  title: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Single stage marker. Hollow grey by default. Fills cyan once the
 * scroll-driven line has descended past this square's y-position
 * within the timeline container, signalling that the previous step
 * has handed off to this one. Rotates clockwise in place as the
 * user scrolls through the section.
 */
const TimelineNode = forwardRef<
  HTMLDivElement,
  {
    heightMV: MotionValue<number>;
    rotateMV: MotionValue<number>;
    threshold: number;
  }
>(({ heightMV, rotateMV, threshold }, ref) => {
  const [filled, setFilled] = useState(false);
  const filledRef = useRef(false);

  // heightMV is built with useTransform(scrollYProgress, [0, 1], [0, height]),
  // so when Timeline's `height` state lands the output range changes and the
  // motion value emits "change" DURING Timeline's render. Calling setFilled
  // straight from the handler is then a cross-component setState mid-render.
  // Ignore non-crossings, and defer the real update off the render phase.
  useMotionValueEvent(heightMV, "change", (h) => {
    const next = h >= threshold;
    if (next === filledRef.current) return;
    filledRef.current = next;
    queueMicrotask(() => setFilled(next));
  });

  return (
    <div
      ref={ref}
      className="absolute left-3 flex h-10 w-10 items-center justify-center bg-background md:left-3"
    >
      <motion.div
        style={{ rotate: rotateMV }}
        className={cn(
          "h-4 w-4 border transition-[background-color,border-color,box-shadow] duration-300",
          filled
            ? "border-cyan bg-cyan shadow-[0_0_12px_rgba(34,211,230,0.55)]"
            : "border-border bg-surface"
        )}
      />
    </div>
  );
});
TimelineNode.displayName = "TimelineNode";

export function Timeline({ data }: { data: TimelineEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [height, setHeight] = useState(0);
  const [thresholds, setThresholds] = useState<number[]>([]);

  useEffect(() => {
    if (!ref.current) return;

    function recalc() {
      if (!ref.current) return;
      setHeight(ref.current.getBoundingClientRect().height);

      // Walk each circle's offsetParent chain up to the timeline
      // container, summing offsetTop. Gives the circle's exact y
      // within the line's coordinate space, including the sticky
      // wrapper offset and per-breakpoint padding. Trigger fires the
      // moment the line front reaches the marker wrapper's top edge
      // (no +40 buffer) — the dot lights as soon as its section starts
      // being scrolled into, not after the line has fully passed
      // through. This matters most on mobile, where sections are
      // tighter and a 40px buffer was a meaningful fraction of total
      // section height, causing the dot to fill only near the end.
      //
      // Special case: the first dot has no preceding section to
      // traverse, so it activates the instant the timeline scrolls
      // into view (heightTransform > 0) rather than waiting for the
      // line to grow past it.
      const ts = circleRefs.current.map((circle, i) => {
        if (!circle) return Infinity;
        if (i === 0) return 1;
        let y = 0;
        let el: HTMLElement | null = circle;
        while (el && el !== ref.current) {
          y += el.offsetTop;
          el = el.offsetParent as HTMLElement | null;
        }
        return y;
      });
      setThresholds(ts);
    }

    recalc();

    // Recalc on resize so the trigger thresholds track the new layout.
    const resizeObserver = new ResizeObserver(recalc);
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, [data.length]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const rotateTransform = useTransform(scrollYProgress, [0, 1], [0, 720]);

  return (
    <div className="w-full font-sans md:px-10" ref={containerRef}>
      <div ref={ref} className="relative mx-auto max-w-7xl pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:gap-10 md:pt-32"
          >
            <div className="sticky top-40 z-40 flex max-w-sm flex-col items-center self-start md:w-full md:flex-row lg:max-w-md">
              <TimelineNode
                ref={(el) => {
                  circleRefs.current[index] = el;
                }}
                heightMV={heightTransform}
                rotateMV={rotateTransform}
                threshold={thresholds[index] ?? Infinity}
              />
              <h3 className="hidden font-mono text-xl font-bold text-muted md:block md:pl-20 md:text-3xl lg:text-4xl">
                {item.title}
              </h3>
            </div>

            <div className="relative w-full pl-20 pr-4 md:pl-4">
              <h3 className="mb-4 block text-left font-mono text-2xl font-bold text-muted md:hidden">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        <div
          style={{ height: height + "px" }}
          className="absolute left-[31px] top-0 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-border to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-[31px]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-cyan via-solana-purple to-transparent from-[0%] via-[10%]"
          />
        </div>
      </div>
    </div>
  );
}
