import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/page-metadata";
import { ProseSection } from "@/components/ui/prose-section";

export const metadata = pageMetadata({
  title: "Manifesto",
  description:
    "Why Entros exists: proof that a live person stands behind a wallet, with your body kept yours, agents tied to the people who direct them, and the work shown in public.",
  path: "/manifesto",
});

const intro = [
  "Software now writes, talks and acts at a scale no person can match. We welcome it. Agents will book our trips, run our errands and trade for us, and they will hand people back hours of their lives.",
  "They also leave a question on the screens you use: is a person on the other end? We are building Entros to answer that question for the people and apps that need it, without asking anyone to give up who they are.",
];

const sections = [
  {
    id: "why-it-matters-now",
    title: "Why it matters now",
    paragraphs: [
      "A DAO vote, an airdrop and a reply thread all rest on one assumption: each account stands for a person who chose to take part. Generated voices and scripted wallets strain that assumption at once. A community that cannot tell people from scripts ends up closing its doors or doubting its own results.",
      "We want a better option. An app should be able to ask whether a live person stands behind a wallet and get an answer, with no gatekeeper holding that person's data.",
    ],
  },
  {
    id: "presence-before-identity",
    title: "Presence before identity",
    paragraphs: [
      "Many checks for a human ask for something you hold: a document, a face scan, an account with history. Those checks answer who you are. A lot of moments need a smaller answer. A live person is here now, and this wallet belongs to someone who has shown up before.",
      "Entros asks for that smaller answer. You say a word and trace a short path, three times. Solana records that your wallet passed. Entros never asks for your name, your face or a document.",
    ],
  },
  {
    id: "your-body-stays-yours",
    title: "Your body stays yours",
    paragraphs: [
      "You cannot replace a face or an iris. Once a copy leaks, it stays leaked for the rest of your life. We chose behaviour instead: the way you say a word, move your hand and hold your phone. Behaviour changes as you live.",
      "Raw motion and full-resolution touch stay on your device. Your spoken words travel to our service for transcription, and we never store the audio. The privacy page lists every other field a verification sends and how long we keep it.",
    ],
  },
  {
    id: "humans-behind-the-machines",
    title: "Humans behind the machines",
    paragraphs: [
      "We expect agents to outnumber people online, and we want that future. An agent that acts for you should still carry your mark.",
      "On devnet today, you can verify a wallet, bind an agent to it and sign a permit for one action. The app that receives the action checks that the agent's owner holds an Entros verification and signed for that action. We want each agent action that matters to trace back to a person who chose it.",
    ],
  },
  {
    id: "show-the-work",
    title: "Show the work",
    paragraphs: [
      "A humanity check earns trust when you can inspect it. Your browser builds a zero-knowledge proof that your new behavioural fingerprint sits close to your last one, without revealing either. The Entros programs, the zero-knowledge circuit and the client SDK are open source. Solana checks each proof in under 200,000 compute units, and any app can read a wallet's Entros Anchor for free.",
      "The service that judges each capture stays private for now, so attackers cannot tune against it. We publish our red-team method and attempt counts. We plan to hand that judgement to a decentralized validator set.",
    ],
  },
  {
    id: "room-to-be-human",
    title: "Room to be human",
    paragraphs: [
      "A passed check opens a door. A verified person can still be wrong, disagree with their community or read for a year without posting. A failed check means the protocol could not accept that attempt. The person behind it can try again and deserves an answer.",
      "We want apps that use Entros to explain what passing permits, how long it lasts and who to ask when a result looks wrong. We also want room for people whose speech or movement differs from the standard rounds. That work is open, and we will keep at it until it serves them.",
    ],
  },
  {
    id: "fast-with-a-hand-on-the-wheel",
    title: "Fast, with a hand on the wheel",
    paragraphs: [
      "We are optimists about AI and about speed. We build in public and release often. We also hold our claims to what we have measured. We say what we have not measured yet, and we keep mainnet behind a trusted-setup ceremony and an external audit. Speed and care can share a road when you show your work at each step.",
    ],
  },
  {
    id: "where-we-are",
    title: "Where we are",
    paragraphs: [
      "Entros is live on Solana devnet and research-grade. On the path to mainnet: a trusted-setup ceremony and an external audit.",
      "We want an internet with room for billions of agents, where any person can still say, without a document or a face scan, I am here. Verify your wallet and help us build it.",
    ],
  },
];

export default function Manifesto() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-3xl px-6 pt-32 pb-16 md:pt-40 md:pb-20">
          <h1 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl">
            Manifesto<span className="text-cyan">.</span>
          </h1>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-foreground/80 md:text-xl">
            {intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {sections.map((section) => (
        <ProseSection key={section.id} id={section.id} title={section.title} size="lg">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </ProseSection>
      ))}

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
          <Link
            href="/verify"
            className="
              group inline-flex items-center justify-center gap-2
              bg-foreground px-6 py-3
              text-sm font-medium text-background
              transition-colors hover:bg-foreground/90
            "
          >
            Verify your wallet
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-10 font-mono text-xs text-foreground/50">Entros Protocol, October 2026</p>
        </div>
      </section>
    </>
  );
}
