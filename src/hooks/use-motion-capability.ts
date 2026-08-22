"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const readBrowserCapability = () => navigator.maxTouchPoints > 0;
const readServerCapability = () => false;

export function useMotionCapability(): boolean {
  return useSyncExternalStore(
    subscribe,
    readBrowserCapability,
    readServerCapability,
  );
}
