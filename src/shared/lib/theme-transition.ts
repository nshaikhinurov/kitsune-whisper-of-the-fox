type StartViewTransition = (callback: () => void) => {
  ready: Promise<void>;
  finished: Promise<void>;
};

let active = false;
const listeners = new Set<(active: boolean) => void>();

function setActive(next: boolean) {
  if (active === next) return;
  active = next;
  for (const l of listeners) l(active);
}

export function isThemeTransitionActive(): boolean {
  return active;
}

export function subscribeThemeTransition(
  listener: (active: boolean) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startThemeTransition(mutate: () => void): void {
  const start = (
    document as Document & { startViewTransition?: StartViewTransition }
  ).startViewTransition;

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!start || reduced) {
    mutate();
    return;
  }

  setActive(true);
  const transition = start.call(document, mutate);
  void transition.finished.finally(() => {
    setActive(false);
  });
  void transition.ready.then(() => {
    const size = Math.max(window.innerWidth, window.innerHeight) * 2;
    document.documentElement.animate(
      {
        maskImage: [`url(/imgs/ori-cat.svg)`, `url(/imgs/ori-cat.svg)`],
        maskPosition: [`50% 50%`, `50% 50%`],
        maskRepeat: [`no-repeat`, `no-repeat`],
        maskSize: [`0px`, `${size}px`],
      },
      {
        duration: 500,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}
