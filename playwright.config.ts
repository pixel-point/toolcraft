import { defineConfig, devices } from "@playwright/test";

import { findAvailablePort, readPreferredPort } from "./scripts/toolcraft-port.mjs";

const resolvedTestPortEnvName = "TOOLCRAFT_RESOLVED_TEST_PORT";
const resolvedTestPort = Number(process.env[resolvedTestPortEnvName]);
const preferredTestPort = readPreferredPort([
  resolvedTestPortEnvName,
  "TOOLCRAFT_TEST_PORT",
  "TOOLCRAFT_PORT",
  "PORT",
]);
const testPort =
  Number.isInteger(resolvedTestPort) && resolvedTestPort > 0 && resolvedTestPort <= 65_535
    ? resolvedTestPort
    : await findAvailablePort(preferredTestPort);
const testBaseUrl = `http://localhost:${testPort}`;
process.env[resolvedTestPortEnvName] = String(testPort);

if (!resolvedTestPort && testPort !== preferredTestPort) {
  console.log(`[toolcraft] Browser test port ${preferredTestPort} is busy; using ${testPort} instead.`);
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: testBaseUrl,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm exec -- vite dev --host 127.0.0.1 --port ${testPort} --strictPort`,
    reuseExistingServer: false,
    timeout: 60_000,
    url: testBaseUrl,
  },
});
