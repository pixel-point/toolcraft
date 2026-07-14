import {
  buildFontPickerGoogleStylesheetHref,
  getFontPickerFontById,
  type FontPickerFontCatalogEntry,
} from "./font-catalog";

export type FontPickerPreviewLoadPriority = "high" | "normal";

type QueuedPreviewTask = {
  fontEntry: FontPickerFontCatalogEntry;
  order: number;
  priorityScore: number;
};

const loadedHrefSet = new Set<string>();
const pendingHrefMap = new Map<string, Promise<void>>();
const loadedFontFaceSet = new Set<string>();
const pendingFontFaceMap = new Map<string, Promise<void>>();
const queuedPreviewTaskMap = new Map<string, QueuedPreviewTask>();
const activeQueuedFontIdSet = new Set<string>();
const maxPreviewLoadConcurrency = 6;

let activeQueuedTaskCount = 0;
let queuedTaskOrderCounter = 0;

function resolvePriorityScore(priority: FontPickerPreviewLoadPriority): number {
  return priority === "high" ? 1 : 0;
}

function resolvePreviewWeights(entry: FontPickerFontCatalogEntry): string[] {
  const uniqueWeights = Array.from(
    new Set(
      entry.weights
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isFinite(value))
        .sort((left, right) => left - right),
    ),
  );

  if (!uniqueWeights.length) {
    return ["400"];
  }

  const pickNearest = (target: number): number =>
    uniqueWeights.reduce((closest, candidate) =>
      Math.abs(candidate - target) < Math.abs(closest - target)
        ? candidate
        : closest,
    );

  return Array.from(new Set([pickNearest(400), pickNearest(600)])).map((value) =>
    String(value),
  );
}

function buildFontFaceDescriptor(
  entry: FontPickerFontCatalogEntry,
  weight: string,
): string {
  return `${weight} 16px "${entry.family.trim().replace(/"/g, '\\"')}"`;
}

function buildFontFaceKey(
  entry: FontPickerFontCatalogEntry,
  weight: string,
): string {
  return `${entry.id}:${weight}`;
}

function escapeSelectorValue(value: string): string {
  return typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(value)
    : value.replace(/["\\]/g, "\\$&");
}

function ensurePreviewFontStylesheet(href: string): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  if (loadedHrefSet.has(href)) {
    return Promise.resolve();
  }

  const existing = document.head.querySelector<HTMLLinkElement>(
    `link[data-toolcraft-font-href="${escapeSelectorValue(href)}"]`,
  );

  if (existing) {
    if (existing.dataset.loaded === "true") {
      loadedHrefSet.add(href);
      return Promise.resolve();
    }

    const pending = pendingHrefMap.get(href);
    if (pending) {
      return pending;
    }

    const nextPending = new Promise<void>((resolve) => {
      existing.addEventListener(
        "load",
        () => {
          existing.dataset.loaded = "true";
          loadedHrefSet.add(href);
          pendingHrefMap.delete(href);
          resolve();
        },
        { once: true },
      );
      existing.addEventListener(
        "error",
        () => {
          pendingHrefMap.delete(href);
          resolve();
        },
        { once: true },
      );
    });

    pendingHrefMap.set(href, nextPending);
    return nextPending;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.crossOrigin = "anonymous";
  link.dataset.toolcraftFontHref = href;

  const pending = new Promise<void>((resolve) => {
    link.addEventListener(
      "load",
      () => {
        link.dataset.loaded = "true";
        loadedHrefSet.add(href);
        pendingHrefMap.delete(href);
        resolve();
      },
      { once: true },
    );
    link.addEventListener(
      "error",
      () => {
        pendingHrefMap.delete(href);
        resolve();
      },
      { once: true },
    );
  });

  pendingHrefMap.set(href, pending);
  document.head.appendChild(link);

  return pending;
}

function ensurePreviewFontFaces(entry: FontPickerFontCatalogEntry): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return Promise.resolve();
  }

  const fontFaceSet = document.fonts;
  const load =
    typeof fontFaceSet.load === "function"
      ? fontFaceSet.load.bind(fontFaceSet)
      : null;
  const check =
    typeof fontFaceSet.check === "function"
      ? fontFaceSet.check.bind(fontFaceSet)
      : null;

  if (!load) {
    return Promise.resolve();
  }

  return Promise.all(
    resolvePreviewWeights(entry).map((weight) => {
      const key = buildFontFaceKey(entry, weight);

      if (loadedFontFaceSet.has(key)) {
        return Promise.resolve();
      }

      const descriptor = buildFontFaceDescriptor(entry, weight);
      if (check?.(descriptor)) {
        loadedFontFaceSet.add(key);
        return Promise.resolve();
      }

      const pending = pendingFontFaceMap.get(key);
      if (pending) {
        return pending;
      }

      const nextPending = load(descriptor)
        .then(() => {
          loadedFontFaceSet.add(key);
        })
        .catch(() => undefined)
        .finally(() => {
          pendingFontFaceMap.delete(key);
        });

      pendingFontFaceMap.set(key, nextPending);
      return nextPending;
    }),
  ).then(() => undefined);
}

export async function ensureFontPickerPreviewLoaded(
  entry: FontPickerFontCatalogEntry,
): Promise<void> {
  await ensurePreviewFontStylesheet(buildFontPickerGoogleStylesheetHref(entry));
  await ensurePreviewFontFaces(entry);
}

export function isFontPickerPreviewLoaded(
  fontEntry: FontPickerFontCatalogEntry | null | undefined,
): boolean {
  if (!fontEntry) {
    return true;
  }

  const href = buildFontPickerGoogleStylesheetHref(fontEntry);
  if (!loadedHrefSet.has(href)) {
    return false;
  }

  if (typeof document === "undefined" || !("fonts" in document)) {
    return true;
  }

  const fontFaceSet = document.fonts;
  const check =
    typeof fontFaceSet.check === "function"
      ? fontFaceSet.check.bind(fontFaceSet)
      : null;

  return resolvePreviewWeights(fontEntry).every((weight) => {
    const key = buildFontFaceKey(fontEntry, weight);
    const descriptor = buildFontFaceDescriptor(fontEntry, weight);
    return loadedFontFaceSet.has(key) || check?.(descriptor) === true;
  });
}

function pickNextQueuedTask(): QueuedPreviewTask | null {
  let nextTask: QueuedPreviewTask | null = null;

  queuedPreviewTaskMap.forEach((task) => {
    if (!nextTask) {
      nextTask = task;
      return;
    }

    if (task.priorityScore > nextTask.priorityScore) {
      nextTask = task;
      return;
    }

    if (task.priorityScore === nextTask.priorityScore && task.order < nextTask.order) {
      nextTask = task;
    }
  });

  return nextTask;
}

function drainPreviewQueue(): void {
  while (activeQueuedTaskCount < maxPreviewLoadConcurrency) {
    const nextTask = pickNextQueuedTask();

    if (!nextTask) {
      return;
    }

    const taskId = nextTask.fontEntry.id;
    queuedPreviewTaskMap.delete(taskId);

    if (isFontPickerPreviewLoaded(nextTask.fontEntry)) {
      continue;
    }

    activeQueuedFontIdSet.add(taskId);
    activeQueuedTaskCount += 1;

    void ensureFontPickerPreviewLoaded(nextTask.fontEntry).finally(() => {
      activeQueuedFontIdSet.delete(taskId);
      activeQueuedTaskCount = Math.max(0, activeQueuedTaskCount - 1);
      drainPreviewQueue();
    });
  }
}

export function queueFontPickerPreviewLoad(
  fontEntryOrId: FontPickerFontCatalogEntry | string | null | undefined,
  options: { priority?: FontPickerPreviewLoadPriority } = {},
): void {
  const fontEntry =
    typeof fontEntryOrId === "string"
      ? getFontPickerFontById(fontEntryOrId)
      : fontEntryOrId;

  if (
    !fontEntry ||
    isFontPickerPreviewLoaded(fontEntry) ||
    activeQueuedFontIdSet.has(fontEntry.id)
  ) {
    return;
  }

  const priorityScore = resolvePriorityScore(options.priority ?? "normal");
  const existing = queuedPreviewTaskMap.get(fontEntry.id);

  if (existing && existing.priorityScore >= priorityScore) {
    return;
  }

  queuedTaskOrderCounter += 1;
  queuedPreviewTaskMap.set(fontEntry.id, {
    fontEntry,
    order: queuedTaskOrderCounter,
    priorityScore,
  });

  drainPreviewQueue();
}

export function queueFontPickerPreviewLoadBatch(
  fontEntries: readonly FontPickerFontCatalogEntry[],
  options: { priority?: FontPickerPreviewLoadPriority } = {},
): void {
  for (const fontEntry of fontEntries) {
    queueFontPickerPreviewLoad(fontEntry, options);
  }
}
