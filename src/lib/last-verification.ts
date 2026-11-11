import { base58ByteLength } from "./base58";

/**
 * The signature of the last verification transaction this browser saw for a
 * wallet. A search of the wallet's history can miss the verification when later
 * transactions crowd it out, so a reader offers this one first. It is only a
 * candidate: the reader checks it on chain like any transaction it finds.
 */

const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet";
const KEY_PREFIX = "entros.last-verification";

const isSignature = (value: string) => base58ByteLength(value) === 64;
const isAddress = (value: string) => base58ByteLength(value) === 32;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const keyFor = (wallet: string, cluster: string) => `${KEY_PREFIX}:${cluster}:${wallet}`;

/** Stores `signature` for `wallet`. False when either is malformed or the store refuses it. */
export function storeLastVerification(
  wallet: string,
  signature: string,
  cluster: string = CLUSTER,
): boolean {
  if (!isAddress(wallet) || !isSignature(signature)) return false;
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(keyFor(wallet, cluster), signature);
    return true;
  } catch {
    return false;
  }
}

/** The stored signature for `wallet`, or null when none is stored or it is malformed. */
export function readLastVerification(wallet: string, cluster: string = CLUSTER): string | null {
  if (!isAddress(wallet)) return null;
  const store = storage();
  if (!store) return null;
  try {
    const value = store.getItem(keyFor(wallet, cluster));
    return value !== null && isSignature(value) ? value : null;
  } catch {
    return null;
  }
}
