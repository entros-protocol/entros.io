export interface MintParameter {
  title: string;
  description: string;
  code?: string;
}

export interface StreamflowTranche {
  tranche: string;
  netLocked: string;
  unlockDate: string;
  unlockUtc: string;
  status: string;
  metadataId: string;
  solscanUrl: string;
}

export const TOKEN_MINT_ADDRESS = "fc7hPCHtpNezg7cAp6UoUksHU6Sy98hEGswf8SSEASY";
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN_SOLSCAN_URL = `https://solscan.io/token/${TOKEN_MINT_ADDRESS}`;
export const TOKEN_LAUNCH_ARCHIVE_URL = `https://kickstart.markets/token/${TOKEN_MINT_ADDRESS}`;

export const FOUNDER_CUSTODY_WALLET =
  "EZYvjJjFdJFCUtyce36LNg6iKcB3JPYFE8BSR2M4jeWh";
export const FOUNDER_CUSTODY_SOLSCAN_URL = `https://solscan.io/account/${FOUNDER_CUSTODY_WALLET}`;
export const STREAMFLOW_NET_LOCKED_TOTAL = "350,776,437 ENTROS";
export const FOUNDER_SALES_STATEMENT =
  "Founder sales to date: zero $ENTROS tokens sold.";

export const mintParameters: MintParameter[] = [
  {
    title: "Standard SPL mint",
    description:
      "Standard SPL token on Solana with 6 decimals and zero Token-2022 extensions.",
    code: TOKEN_PROGRAM_ID,
  },
  {
    title: "Fixed supply",
    description:
      "Mint authority and freeze authority are both revoked. No program or signer can mint new supply or freeze accounts.",
  },
  {
    title: "Launch origin",
    description:
      "Created on a public EasyA Kickstart bonding curve on July 30, 2026 with zero presale, zero private round, and zero VC allocation.",
  },
  {
    title: "Distinct from Entros Anchor",
    description:
      "The devnet Entros Anchor credential uses a separate Token-2022 NonTransferable mint in protocol-core. The two assets share no code or state.",
  },
];

export const streamflowTranches: StreamflowTranche[] = [
  {
    tranche: "Tranche 1",
    netLocked: "110,776,437 ENTROS",
    unlockDate: "Nov 30, 2026",
    unlockUtc: "2026-11-29T23:00:00Z",
    status: "Locked (immutable)",
    metadataId: "C5SNdHSXgL7vcjMDf8D329feKhWKvEttrFtLxewkiS2b",
    solscanUrl:
      "https://solscan.io/account/C5SNdHSXgL7vcjMDf8D329feKhWKvEttrFtLxewkiS2b",
  },
  {
    tranche: "Tranche 2",
    netLocked: "120,000,000 ENTROS",
    unlockDate: "Jan 30, 2027",
    unlockUtc: "2027-01-29T23:00:00Z",
    status: "Locked (immutable)",
    metadataId: "EE8h3JT7SoSEG1m6wHmqye1z6PorLDaiD9Fgk56TJYAx",
    solscanUrl:
      "https://solscan.io/account/EE8h3JT7SoSEG1m6wHmqye1z6PorLDaiD9Fgk56TJYAx",
  },
  {
    tranche: "Tranche 3",
    netLocked: "120,000,000 ENTROS",
    unlockDate: "Jul 30, 2027",
    unlockUtc: "2027-07-29T22:00:00Z",
    status: "Locked (immutable)",
    metadataId: "HMyXkyHL2qoWTWFV32bs4wECwJoTCufLauZuKSmnVJWf",
    solscanUrl:
      "https://solscan.io/account/HMyXkyHL2qoWTWFV32bs4wECwJoTCufLauZuKSmnVJWf",
  },
];
