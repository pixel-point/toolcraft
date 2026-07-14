import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

const requiredDocs = [
  "README.md",
  "workflow.md",
  "assembly-workflow.md",
  "decision-contract.md",
  "schema-reference.md",
  "acceptance-testing.md",
  "performance.md",
  "renderer-technique.md",
  "agent-worklog.md",
  "custom-controls.md",
  "component-rules.md",
];

const requiredCoreDocs = [
  "core/runtime-boundary.md",
  "core/setup-export.md",
  "core/control-selection.md",
  "core/layout.md",
  "core/media-upload.md",
  "core/timeline-animation.md",
  "core/performance.md",
  "core/reference-study.md",
];

const requiredProjectFiles = ["LICENSE.md", "NOTICE.md"];

const requiredRuleIds = [
  "runtime-shell-required",
  "canvas-no-app-ui",
  "canvas-surface-preserved",
  "canvas-handle-placement",
  "panel-host-behavior",
  "layers-enable-only-when-needed",
  "layers-enabled-behavior",
  "timeline-mode-choice",
  "timeline-enabled-behavior",
  "controls-product-coverage",
  "output-export-required",
  "controls-layout-heuristics",
  "renderer-technique-inventory",
  "video-reference-analysis",
  "reference-clone-source-of-truth",
  "acceptance-product-observable",
  "performance-coverage-levels",
  "persistence-policy-explicit",
  "workflow-required",
];

const requiredAgentsEntryLinks = [
  "workflow.md",
  "core/",
];

const requiredWorkflowLinks = [
  ...requiredCoreDocs,
  "assembly-workflow.md",
  "decision-contract.md",
  "schema-reference.md",
  "component-rules.md",
  "acceptance-testing.md",
  "performance.md",
  "renderer-technique.md",
  "custom-controls.md",
];

const requiredWorkflowTerms = [
  "Verification Tier Classifier",
  "Verification tier: Tier N",
  "npm run verify:quick",
  "npm run verify:perf",
  "npm run verify:final",
];

const repoScope = "@repo";
const workspaceProtocol = "workspace";
const forbiddenTextPatterns = [
  new RegExp(`${repoScope}/ui`),
  new RegExp(`${repoScope}/toolcraft-runtime`),
  new RegExp(`${workspaceProtocol}:`),
  /toolcraft-ai-assembly/,
  /\bAI Assembly\b/,
  /How AI/,
];

async function readText(relativePath) {
  return fs.readFile(path.join(projectRoot, relativePath), "utf8");
}

async function fileExists(relativePath) {
  try {
    const stat = await fs.stat(path.join(projectRoot, relativePath));
    return stat.isFile();
  } catch {
    return false;
  }
}

const failures = [];

for (const fileName of [...requiredDocs, ...requiredCoreDocs]) {
  const relativePath = `docs/toolcraft/${fileName}`;

  if (!(await fileExists(relativePath))) {
    failures.push(`missing local Toolcraft doc: ${relativePath}`);
  }
}

for (const relativePath of requiredProjectFiles) {
  if (!(await fileExists(relativePath))) {
    failures.push(`missing required project file: ${relativePath}`);
  }
}

const agentsSource = await readText("AGENTS.md");
const decisionSource = await readText("docs/toolcraft/decision-contract.md");
const docsSources = [agentsSource, decisionSource];

for (const ruleId of requiredRuleIds) {
  if (!agentsSource.includes(ruleId)) {
    failures.push(`AGENTS.md must list decision rule "${ruleId}"`);
  }

  if (!decisionSource.includes(ruleId)) {
    failures.push(`docs/toolcraft/decision-contract.md must list decision rule "${ruleId}"`);
  }
}

for (const fileName of [...requiredDocs, ...requiredCoreDocs]) {
  const source = await readText(`docs/toolcraft/${fileName}`);
  docsSources.push(source);
}

const combinedSource = docsSources.join("\n");
const workflowSource = await readText("docs/toolcraft/workflow.md");

for (const pattern of forbiddenTextPatterns) {
  if (pattern.test(combinedSource)) {
    failures.push(`local Toolcraft docs contain forbidden text pattern ${pattern}`);
  }
}

for (const localDoc of requiredAgentsEntryLinks) {
  if (!agentsSource.includes(`docs/toolcraft/${localDoc}`)) {
    failures.push(`AGENTS.md must link docs/toolcraft/${localDoc}`);
  }
}

for (const localDoc of requiredWorkflowLinks) {
  if (!workflowSource.includes(localDoc)) {
    failures.push(`docs/toolcraft/workflow.md must route to ${localDoc}`);
  }
}

for (const term of requiredWorkflowTerms) {
  if (!agentsSource.includes(term)) {
    failures.push(`AGENTS.md must mention "${term}"`);
  }

  if (!combinedSource.includes(term)) {
    failures.push(`local Toolcraft docs must mention "${term}"`);
  }
}

if (failures.length > 0) {
  console.error("Toolcraft local docs check failed:");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log("Toolcraft local docs check passed.");
