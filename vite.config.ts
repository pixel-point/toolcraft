import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const toolcraftServerIdentityPath = "/.toolcraft/server-identity.json";

function readHtmlAppTitle(source: string): string | null {
  const appTitleMeta = source
    .match(/<meta\b[^>]*>/gi)
    ?.find((tag) => tag.match(/\bname\s*=\s*["']toolcraft-app-title["']/i));

  return appTitleMeta?.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] ?? null;
}

async function createToolcraftServerIdentity() {
  const indexSource = await fs.readFile(path.join(rootDir, "index.html"), "utf8");

  return {
    appTitle: readHtmlAppTitle(indexSource),
    root: await fs.realpath(rootDir),
  };
}

function toolcraftServerIdentityPlugin(): Plugin {
  function handleIdentityRequest(
    request: IncomingMessage,
    response: ServerResponse,
    next: (error?: unknown) => void,
  ) {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== toolcraftServerIdentityPath) {
      next();
      return;
    }

    createToolcraftServerIdentity()
      .then((identity) => {
        response.setHeader("content-type", "application/json; charset=utf-8");
        response.setHeader("cache-control", "no-store");
        response.end(JSON.stringify(identity));
      })
      .catch(next);
  }

  return {
    name: "toolcraft-server-identity",
    configurePreviewServer(server) {
      server.middlewares.use(handleIdentityRequest);
    },
    configureServer(server) {
      server.middlewares.use(handleIdentityRequest);
    },
  };
}

export default defineConfig({
  plugins: [toolcraftServerIdentityPlugin(), tailwindcss(), react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
