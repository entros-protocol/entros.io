import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { ProseSection as Section } from "@/components/ui/prose-section";

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "What Entros receives when you use entros.io, where it goes, how long it is kept, and what stays on your device.",
  path: "/privacy",
});

const UPDATED = "27 October 2026";
const CONTACT = "contact@entros.io";

const sent = [
  "Audio of the words you speak, one short clip per round.",
  "A 308-value feature summary, a pitch (F0) contour and an acceleration-magnitude contour, all computed on your device.",
  "A coarse 64-point outline of each path you trace, with no pressure and no timing.",
  "Capture timing and client signals, such as whether the browser reports automation or a virtual microphone.",
  "Your wallet address, session identifiers, digests and commitments.",
  "Your IP address and browser user agent, as every web request carries them.",
  "A message signed by your wallet when you request an attestation.",
];

const kept = [
  {
    item: "Spoken audio",
    use: "Transcribed by a speech model that runs inside the Entros validation service, to check that you said the words.",
    period: "In memory for the request only. Never written to storage or logs.",
  },
  {
    item: "Feature summary, contours, path outline and client signals",
    use: "Checked during the request.",
    period: "Discarded when the request ends.",
  },
  {
    item: "A 32-byte value derived from the feature summary",
    use: "Stored with your wallet address to spot the same evidence arriving again.",
    period: "30 days.",
  },
  {
    item: "Failed attempts",
    use: "Your wallet address, a keyed hash of your IP address, a reason code and a derived value, used to limit repeated failures.",
    period: "7 days.",
  },
  {
    item: "Verification sessions",
    use: "Keyed hashes of your wallet and IP address, the words and paths issued, digests and a result summary.",
    period: "30 days, or 1 hour for a session that never starts a round.",
  },
  {
    item: "IP address and user agent",
    use: "Rate limits and abuse controls. Stored only as the keyed hashes above.",
    period: "Held in memory for up to 24 hours.",
  },
  {
    item: "Service logs",
    use: "The first six characters of your wallet address, a shortened IP address, capture timing and result summaries.",
    period: "30 days, the log period of our hosting plan.",
  },
];

const onChain = [
  "Your Entros Anchor, a non-transferable token in your wallet.",
  "Your identity state: commitment, Trust Score, verification count and verification times.",
  "An encrypted copy of your baseline that only your wallet can unlock.",
  "Each verification result and the attestation that apps read, with its expiry date.",
  "The protocol fee you pay.",
];

const browser = [
  "Your baseline (fingerprint, salt, commitment and time), encrypted with a key held in your browser. If the browser cannot encrypt it, it is stored unencrypted.",
  "Your theme choice and, on mobile, your wallet app's authorization.",
  "A note that you answered the study consent screen.",
];

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-foreground/30" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Mail() {
  return (
    <a
      href={`mailto:${CONTACT}`}
      className="text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {CONTACT}
    </a>
  );
}

export default function Privacy() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-3xl px-6 pt-32 pb-16 md:pt-40 md:pb-20">
          <h1 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl">
            Privacy<span className="text-cyan">.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
            What Entros receives when you use entros.io, where it goes, how long
            it is kept, and what stays on your device.
          </p>
          <p className="mt-6 font-mono text-xs text-foreground/50">Updated {UPDATED}</p>
        </div>
      </section>

      <Section id="who" title="Who runs this site">
        <p>
          Entros Protocol runs entros.io and the verification services it uses.
          Entros is live on Solana devnet. Send questions and requests to <Mail />.
        </p>
        <p>Entros asks for no name, email address, document or face image.</p>
      </Section>

      <Section id="device" title="What stays on your device">
        <p>
          Raw motion recordings and the full-resolution touch stream never leave
          your device. Your device extracts features from each round and
          generates the zero-knowledge proof.
        </p>
      </Section>

      <Section id="sent" title="What a verification sends">
        <p>When you verify on entros.io, your browser sends the Entros verification service:</p>
        <Bullets items={sent} />
        <p>
          The verification popup that partner apps open runs the same three
          rounds. When it finishes, the partner app receives your wallet address,
          the attestation address, the transaction signature and your Trust Score.
        </p>
      </Section>

      <Section id="kept" title="What Entros keeps, and for how long">
        <div
          aria-hidden
          className="text-sm font-medium hidden gap-6 pb-1 text-foreground/60 md:grid md:grid-cols-[1fr_1.4fr_0.9fr]"
        >
          <span>Data</span>
          <span>Use</span>
          <span>Kept</span>
        </div>
        <dl className="!mt-2 divide-y divide-border border-y border-border">
          {kept.map((row) => (
            <div key={row.item} className="grid gap-1 py-4 md:grid-cols-[1fr_1.4fr_0.9fr] md:gap-6">
              <dt className="font-medium text-foreground">{row.item}</dt>
              <dd>{row.use}</dd>
              <dd className="text-foreground/90">
                <span className="text-foreground/50 md:hidden">Kept: </span>
                {row.period}
              </dd>
            </div>
          ))}
        </dl>
        <p>
          Entros does not keep the feature summary itself, the contours, the path
          outlines, the spoken words or a transcript.
        </p>
      </Section>

      <Section id="on-chain" title="What goes on Solana">
        <p>A completed verification writes public records to Solana devnet:</p>
        <Bullets items={onChain} />
        <p>
          Anyone can read these records, and they stay on chain. Nobody can delete
          them, Entros included.
        </p>
      </Section>

      <Section id="browser" title="What your browser keeps">
        <Bullets items={browser} />
        <p>
          entros.io sets no cookies and runs no analytics or advertising scripts.
          Clearing this site&apos;s data in your browser removes everything above.
        </p>
      </Section>

      <Section id="sharing" title="Share links">
        <p>
          A share link from the result screen carries your wallet address and
          Trust Score, and its preview image shows them. Anyone you send it to
          can see both.
        </p>
      </Section>

      <Section id="study" title="Population study">
        <p>
          Entros runs a devnet population study that you can join only through a
          consent screen. Intake on entros.io is closed at present.
        </p>
        <p>
          A study record is encrypted and holds your wallet address, the derived
          fingerprint, the feature summary, check outcomes and timing. It holds no
          audio, raw motion, raw touch, traced path, words, transcript, IP address
          or browser identifier. Entros deletes each record 30 days after it is
          created. To have yours deleted sooner, write to <Mail />.
        </p>
      </Section>

      <Section id="requests" title="Questions and requests">
        <p>
          Write to <Mail /> to ask what Entros holds for your wallet, or to ask
          for off-chain records to be deleted before they expire. Entros may ask
          you to sign a message with the wallet to show that it is yours.
        </p>
        <p>
          The <Link href="/technology" className="text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground">technology page</Link>{" "}
          explains each step of a verification.
        </p>
      </Section>

      <Section id="changes" title="Changes">
        <p>
          When the way Entros handles data changes, this page changes with it and
          the date at the top moves.
        </p>
      </Section>
    </>
  );
}
