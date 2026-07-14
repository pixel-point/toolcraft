#!/usr/bin/env node

import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import spawn from "cross-spawn";

import {
  findAvailablePort,
  isPortAvailableOnLoopback,
  killListeningProcessesOnPort,
  readPreferredPort,
  readSavedToolcraftPort,
  waitForToolcraftAppOnPort,
  waitForPortAvailable,
  writeSavedToolcraftPort,
} from "./toolcraft-port.mjs";

const viteCommand = process.argv[2] ?? "dev";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = join(scriptDir, "..");
const restartArg = "--toolcraft-restart";
const rawPassthroughArgs = process.argv.slice(3).filter((arg) => arg !== "--");
const restartSamePort =
  process.env.TOOLCRAFT_RESTART === "1" || rawPassthroughArgs.includes(restartArg);
const passthroughArgs = rawPassthroughArgs.filter((arg) => arg !== restartArg);
const preferredPort = readPreferredPort([
  "TOOLCRAFT_DEV_PORT",
  "TOOLCRAFT_PORT",
  "PORT",
]);
const savedPort = await readSavedToolcraftPort();
let port = savedPort;

if (savedPort) {
  console.log(`[toolcraft] Using saved port ${savedPort}.`);

  if (restartSamePort && !(await isPortAvailableOnLoopback(savedPort))) {
    console.log(`[toolcraft] Port ${savedPort} is busy; stopping the existing listener first.`);
    await killListeningProcessesOnPort(savedPort);

    if (!(await waitForPortAvailable(savedPort))) {
      console.log(`[toolcraft] Port ${savedPort} is still busy; forcing listener shutdown.`);
      await killListeningProcessesOnPort(savedPort, { signal: "SIGKILL" });

      if (!(await waitForPortAvailable(savedPort, { timeoutMs: 1_000 }))) {
        throw new Error(`Port ${savedPort} is still busy after forced restart cleanup.`);
      }
    }
  } else if (!restartSamePort && !(await isPortAvailableOnLoopback(savedPort))) {
    try {
      const existingApp = await waitForToolcraftAppOnPort(savedPort, { timeoutMs: 1_200 });
      console.log(`[toolcraft] This app is already running on ${existingApp.url}`);
      process.exit(0);
    } catch (error) {
      console.error(
        `Saved Toolcraft port ${savedPort} is busy, but it is not serving this app. Use the restart script to reclaim the saved port, or remove .toolcraft/server-port.json to assign a new port. ${error?.message ?? ""}`.trim(),
      );
      process.exit(1);
    }
  }
} else if (restartSamePort) {
  console.log("[toolcraft] Restart mode requested, but no saved port exists yet.");
}

if (!port) {
  port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`[toolcraft] Port ${preferredPort} is busy; using ${port} instead.`);
  }
}

const viteBinPath = join(
  projectDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vite.cmd" : "vite",
);

try {
  await access(viteBinPath);
} catch {
  console.error(
    "Vite is not installed. Run this app's dependency installation command before starting the dev server.",
  );
  process.exit(1);
}

const child = spawn(
  viteBinPath,
  [
    viteCommand,
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
    ...passthroughArgs,
  ],
  {
    env: {
      ...process.env,
      TOOLCRAFT_ACTIVE_PORT: String(port),
      PORT: String(port),
    },
    stdio: "inherit",
  },
);

const signalExitCodes = {
  SIGINT: 130,
  SIGTERM: 143,
};

let childExit = null;
const childExitPromise = new Promise((resolve) => {
  child.on("exit", (code, signal) => {
    childExit = { code, signal };
    resolve(childExit);
  });
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

function exitFromChild(code, signal) {
  if (signal) {
    process.exit(signalExitCodes[signal] ?? 1);
    return;
  }

  process.exit(code ?? 0);
}

try {
  const startupResult = await Promise.race([
    waitForToolcraftAppOnPort(port),
    childExitPromise.then(() => "exited"),
  ]);

  if (startupResult === "exited") {
    throw new Error(`Vite exited before serving this Toolcraft app on port ${port}.`);
  }

  await writeSavedToolcraftPort(port);
  console.log(`[toolcraft] Verified this app on ${startupResult.url}`);
} catch (error) {
  console.error(`[toolcraft] ${error?.message ?? error}`);

  if (!childExit) {
    child.kill("SIGTERM");
  }

  process.exit(1);
}

if (childExit) {
  exitFromChild(childExit.code, childExit.signal);
}

childExitPromise.then(({ code, signal }) => {
  exitFromChild(code, signal);
});
