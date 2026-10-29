interface PlaybackTarget {
  destroyed: boolean;
  actualOptions: {
    autoPlay: boolean;
    // v4 moved interactivity into a plugin, so the engine types it as optional.
    interactivity?: { events: { onHover: { mode: string | string[] } } };
    particles: { move: { enable: boolean } };
  };
  play(): void;
  pause(): void;
}

export function syncParticlePlayback(
  container: PlaybackTarget,
  playing: boolean,
  finePointer: boolean,
  driftAllowed = playing,
) {
  if (container.destroyed) return;
  // Also applies before engine restarts after a responsive breakpoint change.
  container.actualOptions.autoPlay = playing;
  // Showcase traversal stops autonomous drift but leaves the render loop alive for repulsion.
  container.actualOptions.particles.move.enable = playing && driftAllowed;
  const hover = container.actualOptions.interactivity?.events.onHover;
  if (hover) hover.mode = playing && finePointer ? "repulse" : [];
  if (playing) container.play();
  else container.pause();
}

/** Own async loading as well as mounted containers, including navigation mid-load. */
export function startParticleSession<T extends { destroy(): void }>({
  initialize,
  load,
  onReady,
  onError,
}: {
  initialize: () => Promise<void>;
  load: () => Promise<T | undefined>;
  onReady: (container: T) => void;
  onError: () => void;
}): () => void {
  let disposed = false;
  let container: T | undefined;

  void (async () => {
    await initialize();
    if (disposed) return;
    const loaded = await load();
    if (!loaded) throw new Error("Particle container unavailable");
    if (disposed) {
      loaded.destroy();
      return;
    }
    container = loaded;
    onReady(loaded);
  })().catch(() => {
    container?.destroy();
    container = undefined;
    if (!disposed) onError();
  });

  return () => {
    disposed = true;
    container?.destroy();
    container = undefined;
  };
}
