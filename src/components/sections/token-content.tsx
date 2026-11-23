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

          <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted md:text-lg">
            Mint properties became immutable at creation on July 30, 2026.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            {mintParameters.map((item) => (
              <div key={item.title} className="bg-surface p-6 md:p-8">
                <h3 className="text-balance font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted md:text-base">
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

            <div className="mt-8 max-w-[52ch] space-y-5 text-base leading-relaxed text-muted md:text-lg">
              <p>
                Entros builds the live human-presence and consent firewall for
                Voice-AI and autonomous agents. Those security products use
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

            <div className="mt-6 max-w-[52ch] space-y-4 text-base leading-relaxed text-muted md:text-lg">
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

          {/* Mobile stacked record cards keep all five fields visible at 320px-767px without horizontal clipping. */}
          <div className="mt-10 space-y-4 md:hidden">
            {streamflowTranches.map((row) => (
              <div
                key={row.metadataId}
                className="bg-surface p-5 forced-colors:border forced-colors:border-[CanvasText]"
              >
                <p className="font-display text-base font-medium text-foreground">
                  {row.tranche}
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-muted">
                      Net locked amount
                    </dt>
                    <dd className="mt-0.5 font-mono text-foreground tabular-nums">
                      {row.netLocked}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">
                      Unlock date
                    </dt>
                    <dd className="mt-0.5 text-foreground">
                      <span>{row.unlockDate}</span>
                      <span className="mt-0.5 block font-mono text-xs text-muted tabular-nums">
                        {row.unlockUtc}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">Status</dt>
                    <dd className="mt-0.5 text-foreground">{row.status}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted">
                      Streamflow metadata
                    </dt>
                    <dd className="mt-0.5">
                      <a
                        href={row.solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-mono text-xs text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground"
                      >
                        {row.metadataId}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Streamflow lockup contracts"
            className="mt-10 hidden overflow-x-auto bg-surface p-6 md:block"
          >
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-muted/80 forced-colors:border-[CanvasText]">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-surface py-3 pr-6 font-medium text-foreground"
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
                        ? "border-b border-muted/80 forced-colors:border-[CanvasText]"
                        : undefined
                    }
                  >
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-surface py-4 pr-6 font-medium text-foreground">
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

          <div className="mt-8 max-w-[52ch] space-y-4 text-sm leading-relaxed text-muted md:text-base">
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
