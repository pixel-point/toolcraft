"use client";

import * as React from "react";

import type { ResolvedToolcraftAppSchema } from "../schema/types";
import { createToolcraftState } from "../state/create-template-state";
import {
  createToolcraftPersistenceSnapshot,
  getToolcraftPersistenceKey,
  mergeToolcraftInitialState,
  parseToolcraftPersistenceSnapshot,
} from "../state/persistence";
import { toolcraftReducer } from "../state/reducer";
import type {
  ToolcraftCommand,
  ToolcraftInitialState,
  ToolcraftState,
} from "../state/types";
import { readToolcraftLocalStorageValue } from "./storage-key-migration";
import { ToolcraftThemeProvider } from "./theme-runtime";

export type ToolcraftContextValue = {
  dispatch: React.Dispatch<ToolcraftCommand>;
  state: ToolcraftState;
};

export const ToolcraftContext = React.createContext<ToolcraftContextValue | null>(null);

export type ToolcraftRootProps = {
  children: React.ReactNode;
  initialState?: ToolcraftInitialState;
  schema: ResolvedToolcraftAppSchema;
};

function readPersistedInitialState(
  schema: ResolvedToolcraftAppSchema,
): ToolcraftInitialState | undefined {
  const storageKey = getToolcraftPersistenceKey(schema.persistence);

  if (!storageKey || typeof window === "undefined") {
    return undefined;
  }

  try {
    return parseToolcraftPersistenceSnapshot(
      schema,
      readToolcraftLocalStorageValue(storageKey),
    );
  } catch {
    return undefined;
  }
}

function writePersistedState(
  schema: ResolvedToolcraftAppSchema,
  state: ToolcraftState,
): void {
  const storageKey = getToolcraftPersistenceKey(schema.persistence);

  if (!storageKey || typeof window === "undefined") {
    return;
  }

  const snapshot = createToolcraftPersistenceSnapshot(state, schema.persistence);

  if (!snapshot) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // Persistence is best-effort; runtime state stays authoritative when storage is unavailable.
  }
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") {
    return false;
  }

  const candidate = target as {
    closest?: (selector: string) => Element | null;
    isContentEditable?: boolean;
    tagName?: string;
  };

  if (candidate.isContentEditable) {
    return true;
  }

  if (typeof candidate.closest === "function" && candidate.closest("[contenteditable='true']")) {
    return true;
  }

  const tagName = candidate.tagName?.toLowerCase();

  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

function isUndoShortcut(event: KeyboardEvent): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.shiftKey &&
    !event.altKey &&
    event.key.toLowerCase() === "z"
  );
}

function isRedoShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();

  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    ((event.shiftKey && key === "z") || (!event.metaKey && event.ctrlKey && key === "y"))
  );
}

export function ToolcraftRoot({
  children,
  initialState,
  schema,
}: ToolcraftRootProps) {
  const [state, dispatch] = React.useReducer(
    toolcraftReducer,
    { initialState, schema },
    ({ initialState, schema }) =>
      createToolcraftState(
        schema,
        mergeToolcraftInitialState(readPersistedInitialState(schema), initialState),
      ),
  );
  const latestStateRef = React.useRef(state);
  const value = React.useMemo(() => ({ dispatch, state }), [dispatch, state]);

  React.useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    if (!schema.toolbar.history || typeof document === "undefined") {
      return undefined;
    }

    const handleDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || isEditableKeyboardTarget(event.target)) {
        return;
      }

      if (isUndoShortcut(event)) {
        event.preventDefault();
        dispatch({ type: "history.undo" });
        return;
      }

      if (isRedoShortcut(event)) {
        event.preventDefault();
        dispatch({ type: "history.redo" });
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [dispatch, schema.toolbar.history]);

  React.useEffect(() => {
    if (schema.persistence.storage !== "localStorage") {
      return undefined;
    }

    const persistTimer = window.setTimeout(() => {
      writePersistedState(schema, state);
    }, 120);

    return () => window.clearTimeout(persistTimer);
  }, [schema, state]);

  React.useEffect(() => {
    if (schema.persistence.storage !== "localStorage") {
      return undefined;
    }

    const handlePageHide = () => {
      writePersistedState(schema, latestStateRef.current);
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [schema]);

  return (
    <ToolcraftThemeProvider>
      <ToolcraftContext.Provider value={value}>{children}</ToolcraftContext.Provider>
    </ToolcraftThemeProvider>
  );
}
