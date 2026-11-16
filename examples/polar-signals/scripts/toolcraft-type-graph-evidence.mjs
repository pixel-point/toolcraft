const DEFAULT_MAX_DEPTH = 24;
const DEFAULT_MAX_VISITS = 256;

export function createToolcraftTypeGraphEvidence({
  childrenOf,
  classify,
  dangerous,
  maxDepth = DEFAULT_MAX_DEPTH,
  maxVisits = DEFAULT_MAX_VISITS,
  safe,
  unknown,
}) {
  const rootCache = new Map();
  // `classify` may inspect another root (e.g. an array's element type). Roots
  // in flight are shared so a type that reaches itself through such a root is
  // a cycle, like `visiting` within one graph, instead of an unbounded descent.
  const activeRoots = new Set();
  let cuts = 0;

  function merge(values) {
    return values.includes(dangerous) ? dangerous
      : values.includes(unknown) ? unknown : safe;
  }

  function inspectRoot(type) {
    const memo = new Map();
    const state = { count: 0 };
    function inspect(candidate, remaining, visiting) {
      if (!candidate) return unknown;
      const direct = classify(candidate);
      if (direct) return direct;
      if (remaining <= 0 || state.count >= maxVisits) return unknown;
      const cached = memo.get(candidate)?.get(remaining);
      if (cached) return cached;
      if (visiting.has(candidate)) return safe;
      state.count += 1;
      const nextVisiting = new Set(visiting).add(candidate);
      const result = merge(childrenOf(candidate).map((child) =>
        inspect(child, remaining - 1, nextVisiting)
      ));
      if (result !== unknown) {
        const byBudget = memo.get(candidate) ?? new Map();
        byBudget.set(remaining, result);
        memo.set(candidate, byBudget);
      }
      return result;
    }
    return inspect(type, maxDepth, new Set());
  }

  return function inspectTypeGraph(type) {
    if (rootCache.has(type)) return rootCache.get(type);
    if (activeRoots.has(type)) {
      cuts += 1;
      return safe;
    }
    if (activeRoots.size >= maxDepth) {
      cuts += 1;
      return unknown;
    }
    const cutsBefore = cuts;
    activeRoots.add(type);
    let result;
    try {
      result = inspectRoot(type);
    } finally {
      activeRoots.delete(type);
    }
    // A result cut short inside an enclosing root is partial and must not
    // answer later callers; the outermost root sees every cycle through itself.
    if (cuts === cutsBefore || activeRoots.size === 0) rootCache.set(type, result);
    return result;
  };
}
