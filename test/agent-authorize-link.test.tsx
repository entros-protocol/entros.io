// @vitest-environment jsdom

import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  fragment: { kind: "none" } as unknown,
  permitMounts: 0,
  bindingMounts: 0,
}));

vi.mock("@/lib/agent-permit-authorize", () => ({
  readAuthorizeFragment: () => harness.fragment,
}));

vi.mock("@/components/sections/agent-permit-review", () => ({
  AgentPermitReview: () => {
    const [mount] = useState(() => ++harness.permitMounts);
    return <p data-testid="permit-mount">{mount}</p>;
  },
}));

vi.mock("@/components/sections/agent-binding-review", () => ({
  AgentBindingReview: () => {
    const [mount] = useState(() => ++harness.bindingMounts);
    return <p data-testid="binding-mount">{mount}</p>;
  },
}));

import { AgentAuthorize } from "../src/components/sections/agent-authorize";

let container: HTMLDivElement;
let root: Root;

async function navigate(hash: string, fragment: unknown) {
  harness.fragment = fragment;
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

const mountOf = (testId: string) => container.querySelector(`[data-testid="${testId}"]`)?.textContent;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  window.location.hash = "";
});

describe("agent authorize page", () => {
  it("starts a fresh permit review when the link changes", async () => {
    await navigate("#request=first", { kind: "request", request: {}, message: "first" });
    await act(async () => root.render(<AgentAuthorize>{null}</AgentAuthorize>));
    const before = mountOf("permit-mount");
    expect(before).toBeDefined();

    await navigate("#request=second", { kind: "request", request: {}, message: "second" });
    expect(mountOf("permit-mount")).not.toBe(before);
  });

  it("starts a fresh binding review when the link changes", async () => {
    await navigate("#bind=first", { kind: "bind", binding: {} });
    await act(async () => root.render(<AgentAuthorize>{null}</AgentAuthorize>));
    const before = mountOf("binding-mount");
    expect(before).toBeDefined();

    await navigate("#bind=second", { kind: "bind", binding: {} });
    expect(mountOf("binding-mount")).not.toBe(before);
  });
});
