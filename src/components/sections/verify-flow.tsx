"use client";

import { Component, useReducer } from "react";
import {
  verifyReducer,
  initialState,
} from "@/components/verify/verify-state-machine";
import { VerifyWalletConnected } from "./verify-wallet-connected";

// Walletless preview removed from the public verify route 2026-05-06: the
// preview path didn't run real validation, so a user could pass by being
// silent for 12 seconds — the impression that creates is incompatible with
// the article's claims about behavioral verification. Driving every tester
// through the wallet-connected (real-validation) path is the only honest
// signal. The walletless components (`verify-walletless.tsx`,
// `verify-mode-toggle.tsx`) and the `VerifyMode` type alias remain in the
// codebase so the path can be restored as a clearly-labelled product demo
// later (or upgraded to a real-validation walletless tier; see master-list
// for the v1.1 follow-up).

class VerifyErrorBoundary extends Component<
  { children: React.ReactNode; onError: () => void },
  { error: string | null }
> {
  state = { error: null as string | null };

  static getDerivedStateFromError(err: Error) {
    return { error: err.message ?? "An unexpected error occurred" };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="space-y-4 py-8 text-center">
          <p className="text-sm text-danger">Verification error</p>
          <p className="text-xs text-foreground/55">{this.state.error}</p>
          <button
            onClick={() => {
              this.setState({ error: null });
              this.props.onError();
            }}
            className="rounded-full border border-border px-6 py-2 text-sm text-foreground/65 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function VerifyFlow() {
  const [state, dispatch] = useReducer(verifyReducer, initialState);

  function handleBoundaryError() {
    dispatch({ type: "RESET" });
  }

  return (
    <div className="space-y-8">
      {/* Pinned-height card: sized for the tallest state (capturing) so the
          surrounding layout doesn't shift between idle / capturing /
          processing / failed / verified. Content centers vertically within
          the fixed container, occasional whitespace in shorter states is
          the deliberate trade-off for layout stability across the flow. */}
      <div className="mx-auto flex h-[620px] md:h-[660px] max-w-xl flex-col justify-center border border-border px-8 py-10">
        <VerifyErrorBoundary onError={handleBoundaryError}>
          <VerifyWalletConnected state={state} dispatch={dispatch} />
        </VerifyErrorBoundary>
      </div>
    </div>
  );
}
