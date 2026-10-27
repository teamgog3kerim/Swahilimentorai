import { test } from "node:test";
import assert from "node:assert/strict";
import { registerServiceWorker } from "../../client/src/lib/registerSW";

test("Service-worker installation and updates never open dialogs or reload unsaved pages", async () => {
  const keys = ["window", "navigator", "confirm"];
  const originals = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  let reloads = 0;
  let dialogs = 0;
  const fakeWindow = Object.assign(new EventTarget(), {
    location: { reload: () => { reloads++; } },
  });
  const container = Object.assign(new EventTarget(), {
    controller: null as object | null,
    register: async (..._args: unknown[]) => registration,
  });
  const registration = Object.assign(new EventTarget(), {
    waiting: null,
    installing: null as (EventTarget & { state: string }) | null,
  });
  Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { serviceWorker: container } });
  Object.defineProperty(globalThis, "confirm", {
    configurable: true, value: () => { dialogs++; return true; },
  });
  try {
    registerServiceWorker();
    fakeWindow.dispatchEvent(new Event("load"));
    await Promise.resolve();
    const install = () => {
      const worker = Object.assign(new EventTarget(), { state: "installing" });
      registration.installing = worker;
      registration.dispatchEvent(new Event("updatefound"));
      worker.state = "installed";
      worker.dispatchEvent(new Event("statechange"));
    };
    install();
    container.controller = {};
    container.dispatchEvent(new Event("controllerchange"));

    install();
    container.controller = {};
    container.dispatchEvent(new Event("controllerchange"));
    install();
    assert.equal(dialogs, 0);
    assert.equal(reloads, 0, "Drafts must not be lost to automatic reloads");
  } finally {
    keys.forEach((key, index) => {
      const descriptor = originals[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    });
  }
});
