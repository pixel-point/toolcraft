import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { promisify } from "node:util";

export const DEFAULT_TOOLCRAFT_PORT = 3002;
export const TOOLCRAFT_APP_TITLE_META_NAME = "toolcraft-app-title";
export const TOOLCRAFT_SERVER_IDENTITY_PATH = "/.toolcraft/server-identity.json";
const LOOPBACK_HOSTS = ["127.0.0.1", "::1"];
const execFileAsync = promisify(execFile);
const PORT_STATE_DIR = ".toolcraft";
const PORT_STATE_FILE = "server-port.json";

export function readPreferredPort(names, fallback = DEFAULT_TOOLCRAFT_PORT, env = process.env) {
  for (const name of names) {
    const value = env[name];

    if (value == null || value === "") {
      continue;
    }

    const port = Number(value);

    if (Number.isInteger(port) && port > 0 && port <= 65_535) {
      return port;
    }
  }

  return fallback;
}

export function isPortAvailable(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();
    server.once("error", () => {
      resolve(false);
    });
    server.listen({ host, port }, () => {
      server.close(() => {
        resolve(true);
      });
    });
  });
}

export async function isPortAvailableOnLoopback(port) {
  const results = await Promise.all(LOOPBACK_HOSTS.map((host) => isPortAvailable(port, host)));

  return results.every(Boolean);
}

export async function findAvailablePort(startPort = DEFAULT_TOOLCRAFT_PORT) {
  for (let port = startPort; port <= 65_535; port += 1) {
    if (await isPortAvailableOnLoopback(port)) {
      return port;
    }
  }

  throw new Error(`No free port found at or above ${startPort}.`);
}

function isValidPort(port) {
  return Number.isInteger(port) && port > 0 && port <= 65_535;
}

export function getToolcraftPortStatePath(cwd = process.cwd()) {
  return path.join(cwd, PORT_STATE_DIR, PORT_STATE_FILE);
}

export async function readSavedToolcraftPort(cwd = process.cwd()) {
  try {
    const source = await fs.readFile(getToolcraftPortStatePath(cwd), "utf8");
    const state = JSON.parse(source);

    return isValidPort(state.port) ? state.port : null;
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) {
      return null;
    }

    throw error;
  }
}

export async function writeSavedToolcraftPort(port, cwd = process.cwd()) {
  if (!isValidPort(port)) {
    throw new Error(`Cannot save invalid Toolcraft port: ${port}.`);
  }

  const statePath = getToolcraftPortStatePath(cwd);
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(
    statePath,
    `${JSON.stringify({ port, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

export async function getListeningProcessIds(port, execFileImpl = execFileAsync) {
  if (!isValidPort(port)) {
    return [];
  }

  try {
    const { stdout } =
      process.platform === "win32"
        ? await execFileImpl("powershell", [
            "-NoProfile",
            "-Command",
            `Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object -ExpandProperty OwningProcess -Unique`,
          ])
        : await execFileImpl("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"]);

    return [...new Set(String(stdout).split(/\s+/).map(Number).filter(Number.isInteger))].filter(
      (pid) => pid > 0 && pid !== process.pid,
    );
  } catch {
    return [];
  }
}

export async function killListeningProcessesOnPort(port, options = {}) {
  const {
    execFileImpl = execFileAsync,
    killProcess = process.kill,
    signal = "SIGTERM",
  } = options;
  const pids = await getListeningProcessIds(port, execFileImpl);

  for (const pid of pids) {
    try {
      killProcess(pid, signal);
    } catch (error) {
      if (error?.code !== "ESRCH") {
        throw error;
      }
    }
  }

  return pids;
}

export async function waitForPortAvailable(port, options = {}) {
  const { intervalMs = 100, timeoutMs = 3_000 } = options;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    if (await isPortAvailableOnLoopback(port)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}

function extractAttribute(tag, name) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i");
  return tag.match(pattern)?.[1] ?? null;
}

export function readToolcraftAppIdentityFromHtml(source) {
  const html = String(source ?? "");
  const title = html.match(/<title>(.*?)<\/title>/is)?.[1]?.trim() ?? null;
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const appTitleMeta = metaTags.find(
    (tag) => extractAttribute(tag, "name")?.toLowerCase() === TOOLCRAFT_APP_TITLE_META_NAME,
  );
  const appTitle = appTitleMeta ? extractAttribute(appTitleMeta, "content") : null;

  return {
    appTitle,
    title,
  };
}

async function getRealPath(filePath) {
  try {
    return await fs.realpath(filePath);
  } catch {
    return path.resolve(filePath);
  }
}

export async function readExpectedToolcraftAppIdentity(cwd = process.cwd()) {
  const indexPath = path.join(cwd, "index.html");
  const source = await fs.readFile(indexPath, "utf8");
  const identity = readToolcraftAppIdentityFromHtml(source);
  const expectedLabel = identity.appTitle ?? identity.title;

  if (!expectedLabel) {
    throw new Error(
      `Cannot verify the Toolcraft server for ${cwd}: index.html has no ${TOOLCRAFT_APP_TITLE_META_NAME} meta tag or title.`,
    );
  }

  return {
    ...identity,
    root: await getRealPath(cwd),
  };
}

export function toolcraftAppIdentityMatches(actual, expected) {
  if (actual.root && expected.root) {
    return actual.root === expected.root;
  }

  if (expected.appTitle) {
    return actual.appTitle === expected.appTitle;
  }

  return actual.title === expected.title;
}

function getToolcraftIdentityLabel(identity) {
  return identity.appTitle ?? identity.title ?? "unknown app";
}

function getToolcraftIdentityDescription(identity) {
  const label = getToolcraftIdentityLabel(identity);

  return identity.root ? `${label} at ${identity.root}` : label;
}

async function fetchTextWithTimeout(url, options = {}) {
  const { fetchImpl = globalThis.fetch, timeoutMs = 1_000 } = options;

  if (typeof fetchImpl !== "function") {
    throw new Error("Cannot verify Toolcraft server identity because fetch is unavailable.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchToolcraftServerIdentity(baseUrl, options = {}) {
  const source = await fetchTextWithTimeout(
    `${baseUrl}${TOOLCRAFT_SERVER_IDENTITY_PATH}?toolcraft-port-check=${Date.now()}`,
    options,
  );
  const parsed = JSON.parse(source);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Toolcraft server identity endpoint returned invalid JSON.");
  }

  if (typeof parsed.root !== "string" || parsed.root.trim() === "") {
    throw new Error("Toolcraft server identity endpoint did not return a project root.");
  }

  return {
    appTitle: typeof parsed.appTitle === "string" ? parsed.appTitle : null,
    root: await getRealPath(parsed.root),
    title: null,
  };
}

function createHttpBaseUrl(host, port) {
  const formattedHost = host.includes(":") ? `[${host}]` : host;

  return `http://${formattedHost}:${port}`;
}

export async function waitForToolcraftAppOnPort(port, options = {}) {
  const {
    cwd = process.cwd(),
    fetchImpl = globalThis.fetch,
    host = "127.0.0.1",
    hosts = [host, "::1"],
    intervalMs = 150,
    timeoutMs = 10_000,
  } = options;
  const expected = await readExpectedToolcraftAppIdentity(cwd);
  const expectedDescription = getToolcraftIdentityDescription(expected);
  const deadline = Date.now() + timeoutMs;
  const candidateHosts = [...new Set(hosts)];
  let lastError = null;

  while (Date.now() <= deadline) {
    for (const candidateHost of candidateHosts) {
      const baseUrl = createHttpBaseUrl(candidateHost, port);
      const url = `${baseUrl}/`;

      try {
        const actual = await fetchToolcraftServerIdentity(baseUrl, { fetchImpl });

        if (!toolcraftAppIdentityMatches(actual, expected)) {
          throw new Error(
            `Port ${port} is serving ${getToolcraftIdentityDescription(
              actual,
            )} instead of this app ${expectedDescription}.`,
          );
        }

        return {
          expected,
          url,
        };
      } catch (error) {
        lastError = error;

        if (/is serving/.test(String(error?.message))) {
          throw error;
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `Timed out waiting for this Toolcraft app ${expectedDescription} on port ${port}. Last error: ${
      lastError?.message ?? "none"
    }`,
  );
}
