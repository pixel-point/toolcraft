import * as React from "react";

const hoverIntentDwellMs = 160;

export function useHoverIntent<T>({
  dwellMs = hoverIntentDwellMs,
  onIntent,
}: {
  dwellMs?: number;
  onIntent: (value: T) => void;
}): {
  cancelIntent: () => void;
  scheduleIntent: (value: T) => void;
} {
  const timeoutRef = React.useRef<number | null>(null);
  const pendingValueRef = React.useRef<T | undefined>(undefined);

  const cancelIntent = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    pendingValueRef.current = undefined;
  }, []);

  const scheduleIntent = React.useCallback(
    (value: T) => {
      cancelIntent();
      pendingValueRef.current = value;
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        const pendingValue = pendingValueRef.current;
        pendingValueRef.current = undefined;
        if (pendingValue !== undefined) {
          onIntent(pendingValue);
        }
      }, dwellMs);
    },
    [cancelIntent, dwellMs, onIntent],
  );

  React.useEffect(() => cancelIntent, [cancelIntent]);

  return { cancelIntent, scheduleIntent };
}
