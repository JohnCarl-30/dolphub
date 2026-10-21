import { describe, expect, it, vi } from "vitest";
import { startParticleSession, syncParticlePlayback } from "./particle-session";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

async function flush() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe("live particle playback", () => {
  function target() {
    return {
      destroyed: false,
      actualOptions: { autoPlay: false, interactivity: { events: { onHover: { mode: [] as string | string[] } } }, particles: { move: { enable: true } } },
      play: vi.fn(), pause: vi.fn(),
    };
  }

  it("pauses rendering and repulsion, including subsequent engine restarts", () => {
    const container = target();
    syncParticlePlayback(container, true, true);
    expect(container.play).toHaveBeenCalledOnce();
    expect(container.actualOptions.interactivity.events.onHover.mode).toBe("repulse");
    expect(container.actualOptions.particles.move.enable).toBe(true);
    syncParticlePlayback(container, false, true);
    expect(container.pause).toHaveBeenCalledOnce();
    expect(container.actualOptions.autoPlay).toBe(false);
    expect(container.actualOptions.interactivity.events.onHover.mode).toEqual([]);
    expect(container.actualOptions.particles.move.enable).toBe(false);
  });

  it("keeps repulsion active while showcase traversal stops autonomous drift", () => {
    const container = target();
    syncParticlePlayback(container, true, true, false);
    expect(container.actualOptions.interactivity.events.onHover.mode).toBe("repulse");
    expect(container.actualOptions.particles.move.enable).toBe(false);
  });

  it("keeps particles moving without repulsion on a coarse pointer", () => {
    const container = target();
    syncParticlePlayback(container, true, false);
    expect(container.play).toHaveBeenCalledOnce();
    expect(container.actualOptions.interactivity.events.onHover.mode).toEqual([]);
  });

  it("does not restart a destroyed container", () => {
    const container = target();
    container.destroyed = true;
    syncParticlePlayback(container, true, true);
    expect(container.play).not.toHaveBeenCalled();
  });
});

describe("particle session lifecycle", () => {
  it("destroys a loaded container exactly once on cleanup", async () => {
    const container = { destroy: vi.fn() };
    const onReady = vi.fn();
    const dispose = startParticleSession({
      initialize: async () => {}, load: async () => container, onReady, onError: vi.fn(),
    });
    await flush();
    expect(onReady).toHaveBeenCalledWith(container);
    dispose();
    dispose();
    expect(container.destroy).toHaveBeenCalledTimes(1);
  });

  it("does not load if navigation happens during initialization", async () => {
    const init = deferred<void>();
    const load = vi.fn();
    const dispose = startParticleSession({ initialize: () => init.promise, load, onReady: vi.fn(), onError: vi.fn() });
    dispose();
    init.resolve();
    await flush();
    expect(load).not.toHaveBeenCalled();
  });

  it("destroys a late container without updating an unmounted component", async () => {
    const pending = deferred<{ destroy: () => void }>();
    const container = { destroy: vi.fn() };
    const onReady = vi.fn();
    const dispose = startParticleSession({ initialize: async () => {}, load: () => pending.promise, onReady, onError: vi.fn() });
    await flush();
    dispose();
    pending.resolve(container);
    await flush();
    expect(container.destroy).toHaveBeenCalledTimes(1);
    expect(onReady).not.toHaveBeenCalled();
  });

  it.each(["initialize", "load", "missing"])("reports %s failure for the static fallback", async (stage) => {
    const onError = vi.fn();
    startParticleSession({
      initialize: async () => { if (stage === "initialize") throw new Error("init failed"); },
      load: async () => { if (stage === "load") throw new Error("load failed"); return undefined; },
      onReady: vi.fn(), onError,
    });
    await flush();
    expect(onError).toHaveBeenCalledOnce();
  });
});
