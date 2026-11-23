import {
  FOUNDER_CUSTODY_SOLSCAN_URL,
  FOUNDER_CUSTODY_WALLET,
  FOUNDER_SALES_STATEMENT,
  mintParameters,
  STREAMFLOW_NET_LOCKED_TOTAL,
  streamflowTranches,
} from "@/data/token-economics";

export function TokenContent() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-28">
          <h2 className="max-w-3xl text-balance font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            On-chain parameters
            <span className="text-[var(--verification-accent-text)]">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            Mint properties became immutable at creation on July 30, 2026.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            {mintParameters.map((item) => (
              <div key={item.title} className="bg-surface p-6 md:p-8">
                <h3 className="font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
                  {item.description}
                </p>
                {item.code ? (
                  <p className="mt-4 break-all font-mono text-xs text-foreground md:text-[13px]">
                    {item.code}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-28">
          <div className="max-w-3xl">
            <h2 className="text-balance font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
              Decoupled from Entros products
              <span className="text-[var(--verification-accent-text)]">.</span>
            </h2>

            <div className="mt-8 space-y-5 text-base leading-relaxed text-muted md:text-lg">
              <p>
                Entros builds the live human-presence and consent firewall for
                voice-AI and autonomous agents. Those security products use
                standard API access and commercial billing.
              </p>
              <p>
                $ENTROS has zero coupling to Entros security products, API
                billing, or engineering roadmaps. Holding $ENTROS grants no
                product access, equity, revenue share, voting control over
                company operations, or fee rights.
              </p>
              <p>
                Earlier roadmap concepts for validator staking, capacity tiers,
                and token governance remain unbuilt and paused alongside Solana
                mainnet deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-28">
          <div className="max-w-3xl">
            <h2 className="text-balance font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
              Public Streamflow lockups
              <span className="text-[var(--verification-accent-text)]">.</span>
            </h2>

            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted md:text-lg">
              <p>
                At launch, the founder bought tokens on the open curve through
                custody wallet{" "}
                <a
                  href={FOUNDER_CUSTODY_SOLSCAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-mono text-sm text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground"
                >
                  {FOUNDER_CUSTODY_WALLET}
                </a>{" "}
                and locked{" "}
                <span className="font-mono text-sm text-foreground tabular-nums md:text-base">
                  {STREAMFLOW_NET_LOCKED_TOTAL}
                </span>{" "}
                (~35% of supply, net of Streamflow fees) across three immutable
                time-based Streamflow contracts. That custody wallet stays
                separate from protocol devnet keys and holds no protocol fee
                treasury.
              </p>
              <p>
                All three contracts pay one recipient wallet, so this record
                lists amounts, unlock dates, and contract accounts with zero
                purpose-split labels.
              </p>
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Streamflow lockup contracts"
            className="mt-10 overflow-x-auto bg-surface p-4 sm:p-6"
          >
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-subtle/30">
                  <th
                    scope="col"
                    className="py-3 pr-6 font-medium text-foreground"
                  >
                    Tranche
                  </th>
                  <th
                    scope="col"
                    className="py-3 pr-6 font-medium text-foreground"
                  >
                    Net locked amount
                  </th>
                  <th
                    scope="col"
                    className="py-3 pr-6 font-medium text-foreground"
                  >
                    Unlock date
                  </th>
                  <th
                    scope="col"
                    className="py-3 pr-6 font-medium text-foreground"
                  >
                    Status
                  </th>
                  <th scope="col" className="py-3 font-medium text-foreground">
                    Streamflow metadata
                  </th>
                </tr>
              </thead>
              <tbody>
                {streamflowTranches.map((row, index) => (
                  <tr
                    key={row.metadataId}
                    className={
                      index < streamflowTranches.length - 1
                        ? "border-b border-subtle/30"
                        : undefined
                    }
                  >
                    <td className="whitespace-nowrap py-4 pr-6 font-medium text-foreground">
                      {row.tranche}
                    </td>
                    <td className="whitespace-nowrap py-4 pr-6 font-mono text-foreground tabular-nums">
                      {row.netLocked}
                    </td>
                    <td className="whitespace-nowrap py-4 pr-6 text-foreground">
                      <span>{row.unlockDate}</span>
                      <span className="mt-0.5 block font-mono text-xs text-muted tabular-nums">
                        {row.unlockUtc}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-4 pr-6 text-muted">
                      {row.status}
                    </td>
                    <td className="whitespace-nowrap py-4">
                      <a
                        href={row.solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground"
                      >
                        {row.metadataId}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
            <p>
              Tranche 1 unlocks at{" "}
              <span className="font-mono text-foreground">
                2026-11-29T23:00:00Z
              </span>
              . This table will update with the confirmed live Streamflow
              contract URL once the planned November 30 re-lock settles on-chain.
            </p>
            <p>
              <span className="font-medium text-foreground">
                {FOUNDER_SALES_STATEMENT}
              </span>{" "}
              Anyone can verify the custody wallet balance and every Streamflow
              escrow on Solscan.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
