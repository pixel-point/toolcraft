const previousToolcraftNamespace = ["creative", "apps", "kit"].join("-");

export function getPreviousToolcraftStorageKey(storageKey: string): string | null {
  if (!storageKey.startsWith("toolcraft:")) {
    return null;
  }

  return `${previousToolcraftNamespace}${storageKey.slice("toolcraft".length)}`;
}

export function readToolcraftLocalStorageValue(storageKey: string): string | null {
  const currentValue = window.localStorage.getItem(storageKey);

  if (currentValue !== null) {
    return currentValue;
  }

  const previousStorageKey = getPreviousToolcraftStorageKey(storageKey);

  if (!previousStorageKey) {
    return null;
  }

  const previousValue = window.localStorage.getItem(previousStorageKey);

  if (previousValue === null) {
    return null;
  }

  try {
    window.localStorage.setItem(storageKey, previousValue);
    window.localStorage.removeItem(previousStorageKey);
  } catch {
    // Migration is best-effort; the caller can still use the previous value.
  }

  return previousValue;
}

export function removeToolcraftLocalStorageValue(storageKey: string): void {
  window.localStorage.removeItem(storageKey);

  const previousStorageKey = getPreviousToolcraftStorageKey(storageKey);

  if (previousStorageKey) {
    window.localStorage.removeItem(previousStorageKey);
  }
}
