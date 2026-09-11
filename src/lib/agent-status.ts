import type { Connection } from "@solana/web3.js";
import {
  fetchIdentityState,
  readAgentOperatorSnapshot,
  readAgentState,
  type AgentOperatorSnapshotReadResult,
  type AgentStateReadResult,
} from "@entros/pulse-sdk";

export interface OwnerAnchor {
  trustScore: number;
  lastVerificationTimestamp: number;
  verificationCount: number;
}

export interface AgentStatus {
  /** Current Core owner and agent wallet, read at one slot. */
  state: AgentStateReadResult;
  /** The current owner's Entros Anchor, or null when that wallet has none. */
  ownerAnchor: OwnerAnchor | null;
  /** The old `entros:human-operator` entry. It grants nothing and may describe a past owner. */
  snapshot: AgentOperatorSnapshotReadResult;
}

type StatusConnection = Pick<
  Connection,
  "getGenesisHash" | "getMultipleAccountsInfoAndContext" | "getAccountInfo"
>;

export async function readAgentStatus(
  agent: string,
  connection: StatusConnection,
): Promise<AgentStatus> {
  const [state, snapshot] = await Promise.all([
    readAgentState({ agent, connection }),
    readAgentOperatorSnapshot(agent, { connection }),
  ]);
  let ownerAnchor: OwnerAnchor | null = null;
  if (state.status === "available") {
    const identity = await fetchIdentityState(state.evidence.owner, connection);
    ownerAnchor = identity && {
      trustScore: identity.trustScore,
      lastVerificationTimestamp: identity.lastVerificationTimestamp,
      verificationCount: identity.verificationCount,
    };
  }
  return { state, ownerAnchor, snapshot };
}
