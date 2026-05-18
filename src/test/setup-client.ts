// React only flushes state updates / effects synchronously inside act() when
// this flag is set. Without it, the hook's phase-driven setTimeouts are not
// registered before the fake clock advances and scoring silently desyncs.
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export {};
