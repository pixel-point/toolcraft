import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  collectToolcraftPerformanceSensitiveControls,
  collectToolcraftUnclassifiedPerformanceControls,
  defineToolcraft,
  validateToolcraftPerformanceCoverage,
} from "@/toolcraft/runtime";

import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

const currentFileName = basename(fileURLToPath(import.meta.url));
const appDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(appDir, "..");
const routesDir = join(appDir, "../routes");
const e2eDir = join(appDir, "../../e2e");
const projectDir = join(appDir, "../..");

function stripJsComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function readFiles(rootDir: string, matcher: RegExp): string {
  const chunks: string[] = [];

  function visit(currentDir: string) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const filePath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!["dist", "node_modules", "toolcraft"].includes(entry.name)) {
          visit(filePath);
        }
        continue;
      }

      if (
        entry.isFile() &&
        matcher.test(entry.name) &&
        !/\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name) &&
        !/^(?:starter-|app-)(?:acceptance|performance)\.ts$/.test(entry.name)
      ) {
        chunks.push(readFileSync(filePath, "utf8"));
      }
    }
  }

  visit(rootDir);
  return chunks.join("\n");
}

function readSiblingAppTestSources(): string {
  return readdirSync(appDir)
    .filter((fileName) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(fileName))
    .filter((fileName) => fileName !== currentFileName)
    .map((fileName) => readFileSync(join(appDir, fileName), "utf8"))
    .map(stripJsComments)
    .join("\n");
}

function readBrowserTestSources(): string {
  return readdirSync(e2eDir)
    .filter((fileName) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(fileName))
    .map((fileName) => readFileSync(join(e2eDir, fileName), "utf8"))
    .map(stripJsComments)
    .join("\n");
}

function readMarkdownFiles(rootDir: string): string {
  if (!existsSync(rootDir)) {
    return "";
  }

  const chunks: string[] = [];

  function visit(currentDir: string) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const filePath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!["dist", "node_modules", "toolcraft"].includes(entry.name)) {
          visit(filePath);
        }
        continue;
      }

      if (entry.isFile() && /\.mdx?$/i.test(entry.name)) {
        chunks.push(readFileSync(filePath, "utf8"));
      }
    }
  }

  visit(rootDir);
  return chunks.join("\n");
}

function readProjectDecisionSources(): string {
  return stripJsComments(
    [
      readMarkdownFiles(join(projectDir, "docs")),
      readMarkdownFiles(join(projectDir, "specs")),
      readMarkdownFiles(join(projectDir, "plans")),
    ].join("\n"),
  );
}

function projectDocsIncludeRendererTechniqueDecision(): boolean {
  const decisionSources = readProjectDecisionSources();

  return [
    /Renderer Technique Decision Matrix/i,
    /sourceRepresentation/,
    /productRepresentation/,
    /previewRenderer/,
    /exportRenderer/,
    /rendererWorkload/,
    /rendererStrategy/,
    /whyNotAlternativeStrategies/,
    /fidelityRisks/,
    /performanceRisks/,
  ].every((pattern) => pattern.test(decisionSources));
}

function projectDocsIncludeRendererLayerInventory(): boolean {
  const decisionSources = readProjectDecisionSources();

  return (
    /Renderer Layer Inventory|rendererTechnique\.layers|layer inventory/i.test(decisionSources) &&
    /backgroundLayer|productForegroundLayer|editingHandlesLayer|exportComposite|product-foreground/i.test(
      decisionSources,
    )
  );
}

function projectDocsIncludeRendererPipelineInventory(): boolean {
  const decisionSources = readProjectDecisionSources();

  return (
    /Render Pipeline Inventory|rendererPipeline|render pipeline/i.test(decisionSources) &&
    /pass|passes|cacheKey|cache key|invalidat/i.test(decisionSources) &&
    /control-drag|viewport-zoom|viewport-drag|media-import|animation-frame|timeline-playback|interaction/i.test(
      decisionSources,
    )
  );
}

function projectDocsExplainRendererAlternatives(): boolean {
  const decisionSources = readProjectDecisionSources();

  return (
    /whyNotAlternativeStrategies/.test(decisionSources) &&
    /alternative|strategy|renderer/i.test(decisionSources) &&
    /text-output|vector-output|pixel-output|rendererWorkload/.test(decisionSources) &&
    /exportRenderer|export\/copy|product-quality/i.test(decisionSources)
  );
}

function sourceUsesCustomRenderer(): boolean {
  const routeSources = stripJsComments(readFiles(routesDir, /\.(ts|tsx)$/));
  const appSources = stripJsComments(readFiles(srcDir, /\.(ts|tsx)$/));

  return (
    /canvasContent\s*=/.test(routeSources) ||
    /renderDefaultCanvasMedia=\{false\}/.test(routeSources) ||
    /useToolcraft(Value)?\(/.test(appSources) ||
    /getContext\(["']2d["']\)|webgl|webgpu|OffscreenCanvas|ImageData/.test(appSources)
  );
}

function sourceUsesHardcodedOutputBackgroundColor(
  source = stripJsComments(readFiles(srcDir, /\.(ts|tsx|css)$/)),
): boolean {
  const canvasFillPattern =
    /(?:ctx|context|canvasContext)\.fillStyle\s*=\s*["']#[0-9a-fA-F]{3,8}["'][\s\S]{0,240}\.fillRect\s*\(/;
  const outputCssBackgroundPattern =
    /\.(?:[a-z0-9_-]*(?:canvas|renderer|preview|output|product)[a-z0-9_-]*)\s*{[^}]*background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,8}/i;

  return canvasFillPattern.test(source) || outputCssBackgroundPattern.test(source);
}

function schemaHasOutputBackgroundColorControl(): boolean {
  return (appSchema.panels.controls?.sections ?? []).some((section) =>
    Object.values(section.controls).some((control) => {
      if (control.type !== "color") {
        return false;
      }

      const searchText = [
        section.title,
        typeof control.label === "string" ? control.label : "",
        control.target,
      ].join(" ");

      return /\b(background|backdrop|scene|canvas)\b/i.test(searchText);
    }),
  );
}

function projectDocsIncludeFixedBackgroundDecision(): boolean {
  return /fixedBackgroundReason|fixed background|non-editable background|not user-editable background|reference-defined background|product-defined background/i.test(
    readProjectDecisionSources(),
  );
}

function sourceUsesCpuPixelLoop(): boolean {
  const appSources = stripJsComments(readFiles(srcDir, /\.(ts|tsx)$/));
  const cpuPixelMethodCallPattern =
    /(?:\.(?:createImageData|getImageData|putImageData)|\[\s*["'](?:createImageData|getImageData|putImageData)["']\s*\])\s*\(/;

  return (
    /new\s+ImageData\s*\(/.test(appSources) ||
    cpuPixelMethodCallPattern.test(appSources)
  );
}

function appPerformanceHasRenderPipelinePass(kind: string): boolean {
  return (appPerformance.rendererPipeline?.passes ?? []).some(
    (pass) => pass.kind === kind,
  );
}

function appPerformanceHasInteractionInvalidation(interaction: string): boolean {
  return (appPerformance.rendererPipeline?.interactionInvalidation ?? []).some(
    (entry) => entry.interaction === interaction,
  );
}

function sourceUsesGpuRenderer(): boolean {
  const appSources = stripJsComments(readFiles(srcDir, /\.(ts|tsx)$/));

  return /getContext\(["']webgl2?["']\)|navigator\.gpu|GPUCanvasContext/.test(appSources);
}

function sourceUsesWebGlLifecycleGuard(): boolean {
  const appSources = stripJsComments(readFiles(srcDir, /\.(ts|tsx)$/));

  return (
    /useEffect\s*\(/.test(appSources) ||
    /useLayoutEffect\s*\(/.test(appSources) ||
    /useMemo\s*\(/.test(appSources) ||
    /useRef\s*\(/.test(appSources) ||
    /class\s+\w+Renderer/.test(appSources)
  );
}

function sourceCreatesWebGlContextInComponentRender(): boolean {
  const appSources = stripJsComments(readFiles(srcDir, /\.(ts|tsx)$/));
  const componentRenderPattern =
    /function\s+[A-Z]\w*\s*\([^)]*\)\s*{(?![\s\S]{0,600}use(?:Layout)?Effect\s*\()[\s\S]{0,600}\.getContext\(["']webgl2?["']\)/;

  return componentRenderPattern.test(appSources);
}

function sourceMayUploadTextureFromTimelineDrivenEffect(): boolean {
  const appSources = stripJsComments(readFiles(srcDir, /\.(ts|tsx)$/));
  const timelineDrivenTextureUploadPattern =
    /use(?:Layout)?Effect\s*\(\s*\(\)\s*=>\s*{[\s\S]*?(?:texImage2D\s*\(|\.setImage\s*\()[\s\S]*?}\s*,\s*\[[\s\S]*?(?:settings|state\.timeline|currentTimeSeconds|keyframeGroups)[\s\S]*?\]\s*\)/;

  return timelineDrivenTextureUploadPattern.test(appSources);
}

function sourceResyncsTimelineDurationFromRuntimeDuration(): boolean {
  const appSources = stripJsComments(readFiles(srcDir, /\.(ts|tsx)$/));
  const durationResyncPattern =
    /use(?:Layout)?Effect\s*\(\s*\(\)\s*=>\s*{[\s\S]*?timeline\.setDuration[\s\S]*?}\s*,\s*\[[\s\S]*state\.timeline\.durationSeconds[\s\S]*\]\s*\)/;

  return durationResyncPattern.test(appSources);
}

function sourceUsesLowResolutionPreviewUpscale(source = stripJsComments(readFiles(srcDir, /\.(ts|tsx)$/))): boolean {
  const lowResolutionPreviewPattern =
    /maxPreviewPixels|previewPixelBudget|previewScale|previewRatio|lowRes|lowResolution|downsample/i;
  const scaledDrawImagePattern =
    /\.drawImage\s*\([\s\S]{0,240}(?:outputWidth|outputHeight|state\.canvas\.size|canvas\.width|canvas\.height)[\s\S]{0,240}\)/;

  return lowResolutionPreviewPattern.test(source) || scaledDrawImagePattern.test(source);
}

function browserTestsAssertNativePreviewResolution(): boolean {
  const browserTestSources = readBrowserTestSources();

  return (
    /previewWidth|previewHeight|clientWidth|clientHeight|getBoundingClientRect/.test(
      browserTestSources,
    ) &&
    /outputWidth|outputHeight|state\.canvas\.size|canvas\.size|toHaveAttribute/.test(
      browserTestSources,
    )
  );
}

function browserPerfContractRequiresRenderScaleBackingPixels(): boolean {
  const browserTestSources = readBrowserTestSources();

  return (
    /scenarioUsesRenderScaleFixture/.test(browserTestSources) &&
    /expectToolcraftCanvasBackingPixelsForRenderScale/.test(browserTestSources)
  );
}

function sourceUsesAnimationFrameWithoutCleanup(): boolean {
  const appSources = stripJsComments(readFiles(srcDir, /\.(ts|tsx)$/));

  return /requestAnimationFrame\s*\(/.test(appSources) && !/cancelAnimationFrame\s*\(/.test(appSources);
}

function sourceUsesDirectStorageApi(): boolean {
  const appSources = stripJsComments(readFiles(srcDir, /\.(ts|tsx)$/));

  return /\b(?:localStorage|sessionStorage)\s*\./.test(appSources);
}

describe("Toolcraft template app performance coverage", () => {
  it("publishes separate browser acceptance and performance fallback gates", () => {
    const packageJson = JSON.parse(readFileSync(join(projectDir, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const runScriptPattern = (scriptName: string) =>
      `(?:pnpm ${scriptName}|npm run ${scriptName})`;

    expect(
      packageJson.scripts?.["test:browser"],
      "Generated apps must keep full performance scenarios out of the default browser acceptance gate.",
    ).toBe('playwright install chromium && playwright test --grep-invert "browser perf:"');
    expect(
      packageJson.scripts?.["test:browser:perf"],
      "Generated apps must expose a sequential Playwright fallback so perf budgets can be measured when no agent browser is available.",
    ).toBe(
      'playwright install chromium && playwright test --grep "browser perf:" --workers=1 --pass-with-no-tests',
    );
    expect(packageJson.scripts?.["verify:quick"]).toMatch(
      new RegExp(`^${runScriptPattern("ai:check")} && ${runScriptPattern("test")}$`),
    );
    expect(packageJson.scripts?.["verify:ui"]).toMatch(
      new RegExp(`^${runScriptPattern("test:browser")}$`),
    );
    expect(packageJson.scripts?.["verify:perf"]).toMatch(
      new RegExp(`^${runScriptPattern("test:browser:perf")}$`),
    );
    expect(packageJson.scripts?.["verify:perf:playwright"]).toMatch(
      new RegExp(`^${runScriptPattern("test:browser:perf")}$`),
    );
    expect(packageJson.scripts?.["verify:final"]).toMatch(
      new RegExp(
        `^${runScriptPattern("ai:check")} && ${runScriptPattern("test")} && ${runScriptPattern("build")} && ${runScriptPattern("test:browser")}$`,
      ),
    );
  });

  it("keeps the Playwright performance audit inside the browser perf tag", () => {
    const source = readFileSync(join(e2eDir, "app-performance.spec.ts"), "utf8");
    const testNames = [...source.matchAll(/test\(\s*(["'`])([^"'`]+)\1/g)].map(
      (match) => match[2],
    );

    expect(source).not.toContain("TOOLCRAFT_PERF_CHECK");
    expect(testNames.length).toBeGreaterThan(0);
    expect(
      testNames.every((name) => name.includes("browser perf:")),
      `app-performance.spec.ts tests must all be tagged for the dedicated perf checkpoint: ${testNames.join(", ")}`,
    ).toBe(true);
  });

  it("declares agent browser as the preferred performance runner", () => {
    expect(appPerformance.browserCheckPolicy).toEqual({
      fallbackRunner: "playwright",
      fallbackWhen: ["agent-browser-unavailable", "ci"],
      preferredRunner: "agent-browser",
    });
  });

  it("requires valid performance coverage for declared workload scenarios", () => {
    expect(validateToolcraftPerformanceCoverage(appSchema, appPerformance)).toEqual([]);
  });

  it("requires every visible control to classify its performance role", () => {
    const unclassifiedControls =
      collectToolcraftUnclassifiedPerformanceControls(appSchema);

    expect(
      unclassifiedControls,
      "Every visible non-action control must declare performanceRole as workload or responsiveness so AI cannot skip the performance decision.",
    ).toEqual([]);
  });

  it("requires generated custom renderers to opt into the performance matrix", () => {
    if (sourceUsesCustomRenderer()) {
      expect(appPerformance.usesCustomRenderer).toBe(true);
    }
  });

  it("requires custom renderer apps to document the renderer technique decision", () => {
    if (!appPerformance.usesCustomRenderer) {
      return;
    }

    expect(
      projectDocsIncludeRendererTechniqueDecision(),
      "Custom renderer apps must write a Renderer Technique Decision Matrix in their app spec/plan docs before implementation; AGENTS.md rules alone do not count as the app decision.",
    ).toBe(true);
  });

  it("requires custom renderer apps to document the renderer layer inventory", () => {
    if (!appPerformance.usesCustomRenderer) {
      return;
    }

    expect(
      projectDocsIncludeRendererLayerInventory(),
      "Custom renderer apps must write a Renderer Layer Inventory in their app spec/plan docs so dense raster backgrounds cannot silently rasterize semantic foreground output.",
    ).toBe(true);
  });

  it("requires custom renderer apps to document the render pipeline inventory", () => {
    if (!appPerformance.usesCustomRenderer) {
      return;
    }

    expect(
      projectDocsIncludeRendererPipelineInventory(),
      "Custom renderer apps must write a Render Pipeline Inventory in their app spec/plan docs before implementation so expensive passes, cache keys, and invalidation rules are deliberate.",
    ).toBe(true);
  });

  it("requires custom renderer apps to mirror the renderer decision in typed performance config", () => {
    if (!appPerformance.usesCustomRenderer) {
      return;
    }

    expect(
      appPerformance.rendererTechnique,
      "Custom renderer apps must declare rendererTechnique in app-performance.ts; prose specs and plans are not enough.",
    ).toBeDefined();
  });

  it("requires custom renderer apps to mirror the render pipeline in typed performance config", () => {
    if (!appPerformance.usesCustomRenderer) {
      return;
    }

    expect(
      appPerformance.rendererPipeline,
      "Custom renderer apps must declare rendererPipeline in app-performance.ts; prose specs and plans are not enough.",
    ).toBeDefined();
  });

  it("requires custom renderer apps to mirror layer inventory in typed performance config", () => {
    if (!appPerformance.usesCustomRenderer) {
      return;
    }

    expect(
      appPerformance.rendererTechnique?.layers?.length ?? 0,
      "Custom renderer apps must mirror the Renderer Layer Inventory in app-performance.ts rendererTechnique.layers so browser tests and zoom-stress classification can verify the real visual layers.",
    ).toBeGreaterThan(0);
  });

  it("requires custom renderer apps to explain rejected renderer alternatives", () => {
    if (!appPerformance.usesCustomRenderer) {
      return;
    }

    expect(
      projectDocsExplainRendererAlternatives(),
      "Custom renderer specs must explain why the chosen preview/export renderer fits the product better than alternatives, including reference preservation, workload, and product-quality export behavior.",
    ).toBe(true);
  });

  it("requires renderer-owned hardcoded backgrounds to be schema-controlled or explicitly fixed", () => {
    if (!sourceUsesHardcodedOutputBackgroundColor()) {
      return;
    }

    expect(
      schemaHasOutputBackgroundColorControl() || projectDocsIncludeFixedBackgroundDecision(),
      "Renderer-owned output background colors must be schema color controls. If a background is intentionally fixed, document the fixed background reason in the app spec/plan so the missing control is deliberate.",
    ).toBe(true);
  });

  it("requires custom renderers to declare a renderer strategy", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "none",
        rendererWorkload: "simple-composition",
        scenarios: appPerformance.scenarios,
        usesCustomRenderer: true,
        workloadTargets: appPerformance.workloadTargets,
      }),
    ).toEqual(
      expect.arrayContaining([
        'Custom renderers must declare rendererStrategy "dom", "svg", "canvas-2d", "webgl", or "webgpu".',
      ]),
    );
  });

  it("rejects renderer strategies on non-custom apps", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "canvas-2d",
        rendererWorkload: "none",
        scenarios: appPerformance.scenarios,
        usesCustomRenderer: false,
        workloadTargets: appPerformance.workloadTargets,
      }),
    ).toEqual(
      expect.arrayContaining([
        'Non-custom renderer configs must use rendererStrategy "none", received "canvas-2d".',
      ]),
    );
  });

  it("requires custom renderers to declare a non-empty renderer workload", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "canvas-2d",
        rendererWorkload: "none",
        scenarios: appPerformance.scenarios,
        usesCustomRenderer: true,
        workloadTargets: appPerformance.workloadTargets,
      }),
    ).toEqual(
      expect.arrayContaining([
        'Custom renderers must declare rendererWorkload "simple-composition", "text-output", "vector-output", or "pixel-output".',
      ]),
    );
  });

  it("rejects renderer workloads on non-custom apps", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "none",
        rendererWorkload: "simple-composition",
        scenarios: appPerformance.scenarios,
        usesCustomRenderer: false,
        workloadTargets: appPerformance.workloadTargets,
      }),
    ).toEqual(
      expect.arrayContaining([
        'Non-custom renderer configs must use rendererWorkload "none", received "simple-composition".',
      ]),
    );
  });

  it("requires pixel-output renderers to use GPU or measured CPU evidence", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "canvas-2d",
        rendererWorkload: "pixel-output",
        scenarios: appPerformance.scenarios,
        usesCustomRenderer: true,
        workloadTargets: appPerformance.workloadTargets,
      }),
    ).toEqual(
      expect.arrayContaining([
        'rendererWorkload "pixel-output" should use rendererStrategy "webgl" or "webgpu", received "canvas-2d". Keeping a CPU renderer requires rendererTechnique.measuredAlternativeEvidence for WebGL/WebGPU stress comparison.',
      ]),
    );
  });

  it("rejects text and vector product techniques that silently choose pixel output", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "webgl",
        rendererTechnique: {
          exportRenderer: "webgl",
          fidelityRisks: ["raster output could blur product geometry"],
          performanceRisks: ["large output requires GPU-backed drawing"],
          previewRenderer: "webgl",
          productRepresentation: "vector",
          rendererStrategy: "webgl",
          rendererWorkload: "pixel-output",
          sourceRepresentation: "svg",
          whyNotAlternativeStrategies: ["svg preview was not selected"],
        },
        rendererWorkload: "pixel-output",
        scenarios: appPerformance.scenarios,
        usesCustomRenderer: true,
        workloadTargets: appPerformance.workloadTargets,
      }),
    ).toEqual(
      expect.arrayContaining([
        'productRepresentation "vector" requires rendererWorkload "vector-output" unless intentionalRasterizationReason is provided.',
      ]),
    );
  });

  it("requires pixel-output renderers to include a stress preview or animation scenario", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "webgl",
        rendererWorkload: "pixel-output",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: preview render stays under budget",
            browser: true,
            browserTestName: "browser perf: preview render stays under budget",
            budget: { maxLongTaskMs: 120, maxPreviewMs: 1000 },
            expectedObservable: "Preview renders without freezing.",
            fixture: "1600x1000 output fixture",
            id: "preview-render",
            interaction: "preview-render",
            workload: false,
          },
          {
            automated: true,
            automatedTestName: "perf: prompt changes stay responsive",
            browser: true,
            browserTestName: "browser perf: prompt changes stay responsive",
            budget: { maxFrameGapMs: 80, maxInteractionMs: 500 },
            controlLabel: "Prompt",
            expectedObservable: "Prompt changes without blocking preview.",
            fixture: "starter prompt fixture",
            id: "generation-prompt-change",
            interaction: "control-change",
            target: "generation.prompt",
            values: {
              default: "Describe the effect",
              max: "Performance verified prompt with a longer generation request",
              min: "",
            },
            workload: true,
          },
          {
            automated: true,
            automatedTestName: "perf: viewport stays stable",
            browser: true,
            browserTestName: "browser perf: viewport stays stable",
            budget: { maxFrameGapMs: 80 },
            expectedObservable: "Viewport remains stable.",
            fixture: "1600x1000 output fixture",
            id: "viewport-stability",
            interaction: "viewport-stability",
            workload: false,
          },
        ],
        usesCustomRenderer: true,
        workloadTargets: ["generation.prompt"],
      }),
    ).toEqual(
      expect.arrayContaining([
        'rendererWorkload "pixel-output" must include a stress preview-render or animation-frame scenario with stress: true for the largest product canvas and heaviest workload values.',
      ]),
    );
  });

  it("requires pixel-output renderers to budget long tasks", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "webgl",
        rendererWorkload: "pixel-output",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: preview render stays under budget",
            browser: true,
            browserTestName: "browser perf: preview render stays under budget",
            budget: { maxPreviewMs: 1000 },
            expectedObservable: "Worst-case preview renders without freezing.",
            fixture: "2400x1600 worst-case output fixture",
            id: "preview-render",
            interaction: "preview-render",
            stress: true,
            workload: false,
          },
          {
            automated: true,
            automatedTestName: "perf: prompt changes stay responsive",
            browser: true,
            browserTestName: "browser perf: prompt changes stay responsive",
            budget: { maxFrameGapMs: 80, maxInteractionMs: 500 },
            controlLabel: "Prompt",
            expectedObservable: "Prompt changes without blocking preview.",
            fixture: "starter prompt fixture",
            id: "generation-prompt-change",
            interaction: "control-change",
            target: "generation.prompt",
            values: {
              default: "Describe the effect",
              max: "Performance verified prompt with a longer generation request",
              min: "",
            },
            workload: true,
          },
          {
            automated: true,
            automatedTestName: "perf: viewport stays stable",
            browser: true,
            browserTestName: "browser perf: viewport stays stable",
            budget: { maxFrameGapMs: 80 },
            expectedObservable: "Viewport remains stable.",
            fixture: "1600x1000 output fixture",
            id: "viewport-stability",
            interaction: "viewport-stability",
            workload: false,
          },
        ],
        usesCustomRenderer: true,
        workloadTargets: ["generation.prompt"],
      }),
    ).toEqual(
      expect.arrayContaining([
        'rendererWorkload "pixel-output" must include at least one maxLongTaskMs budget so GPU-backed previews cannot pass while freezing the main thread.',
      ]),
    );
  });

  it("detects low-resolution preview upscale code paths", () => {
    expect(
      sourceUsesLowResolutionPreviewUpscale(`
        const maxPreviewPixels = 1_250_000;
        const previewScale = Math.sqrt(maxPreviewPixels / (outputWidth * outputHeight));
        previewContext.drawImage(offscreenCanvas, 0, 0, outputWidth, outputHeight);
      `),
    ).toBe(true);

    expect(
      sourceUsesLowResolutionPreviewUpscale(`
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        drawAsciiTextToCanvas({ canvas, text });
      `),
    ).toBe(false);
  });

  it("rejects low-resolution preview upscale for text and vector output renderers", () => {
    if (
      appPerformance.rendererWorkload !== "text-output" &&
      appPerformance.rendererWorkload !== "vector-output"
    ) {
      return;
    }

    expect(
      sourceUsesLowResolutionPreviewUpscale(),
      "Text/vector product previews must preserve native output fidelity. Do not render a low-resolution preview canvas/texture and upscale it to state.canvas.size; optimize layout/drawing instead.",
    ).toBe(false);
  });

  it("requires text and vector output browser tests to prove native preview resolution", () => {
    if (
      !appPerformance.usesCustomRenderer ||
      (appPerformance.rendererWorkload !== "text-output" &&
        appPerformance.rendererWorkload !== "vector-output")
    ) {
      return;
    }

    expect(
      browserTestsAssertNativePreviewResolution(),
      "Text/vector custom renderers must have a browser test proving visible preview dimensions match product output dimensions so low-resolution upscale cannot pass unnoticed.",
    ).toBe(true);
  });

  it("requires render scale scenarios to prove backing canvas pixels in browser performance tests", () => {
    expect(
      browserPerfContractRequiresRenderScaleBackingPixels(),
      "Browser performance contract must require renderScale scenarios to assert backing canvas pixels, not only state or labels.",
    ).toBe(true);
  });

  it("requires procedural pixel-loop renderers to use a GPU strategy", () => {
    if (!sourceUsesCpuPixelLoop()) {
      return;
    }

    expect(
      appPerformance.rendererWorkload,
      "Procedural ImageData/getImageData/putImageData renderers must be classified as pixel-output.",
    ).toBe("pixel-output");
    expect(
      appPerformance.rendererStrategy,
      "Procedural ImageData/getImageData/putImageData renderers must be converted to WebGL/WebGPU or removed from the critical render path.",
    ).toMatch(/^(webgl|webgpu)$/);
    expect(
      sourceUsesGpuRenderer(),
      "Procedural pixel renderers must contain an actual WebGL/WebGPU code path, not only declare a GPU strategy.",
    ).toBe(true);
    expect(
      appPerformanceHasRenderPipelinePass("pixel-transform"),
      "Procedural pixel renderers must declare a rendererPipeline pixel-transform pass so caching and invalidation are machine-checkable.",
    ).toBe(true);
  });

  it("requires custom renderers to declare high-frequency viewport invalidation", () => {
    if (!appPerformance.usesCustomRenderer) {
      return;
    }

    expect(
      appPerformanceHasInteractionInvalidation("viewport-zoom"),
      "Custom renderer apps must declare rendererPipeline interactionInvalidation for viewport-zoom so zoom can stay responsive without recomputing expensive passes.",
    ).toBe(true);
  });

  it("requires WebGL/WebGPU renderers to keep their pipeline lifecycle outside React render", () => {
    if (!sourceUsesGpuRenderer()) {
      return;
    }

    expect(
      sourceUsesWebGlLifecycleGuard(),
      "WebGL/WebGPU renderer setup must be guarded by refs, memoized setup, an effect, or a renderer class so control changes update uniforms/buffers instead of rebuilding the pipeline.",
    ).toBe(true);
    expect(
      sourceCreatesWebGlContextInComponentRender(),
      "Do not create a WebGL context directly in the component render path; initialize it once and update uniforms/buffers on runtime value changes.",
    ).toBe(false);
  });

  it("requires animation loops to clean up scheduled frames", () => {
    expect(
      sourceUsesAnimationFrameWithoutCleanup(),
      "Renderers that schedule requestAnimationFrame must cancelAnimationFrame on cleanup to avoid runaway loops during control changes or route unmount.",
    ).toBe(false);
  });

  it("rejects direct app storage writes outside the runtime persistence policy", () => {
    expect(
      sourceUsesDirectStorageApi(),
      "Generated apps must not read or write app state through localStorage/sessionStorage directly. Use runtime persistence policy when product persistence is required.",
    ).toBe(false);
  });

  it("rejects renderer effects that overwrite user-edited timeline duration", () => {
    expect(
      sourceResyncsTimelineDurationFromRuntimeDuration(),
      "Renderers must not watch state.timeline.durationSeconds and dispatch timeline.setDuration back to a computed local duration. Compute a default only during initialization/reset, then map renderer progress to state.timeline.durationSeconds.",
    ).toBe(false);
  });

  it("rejects timeline-driven texture uploads in GPU keyframe renderers", () => {
    if (
      !sourceUsesGpuRenderer() ||
      appSchema.panels.timeline?.enabled !== true ||
      appSchema.panels.timeline.mode !== "keyframes"
    ) {
      return;
    }

    expect(
      sourceMayUploadTextureFromTimelineDrivenEffect(),
      "GPU keyframe renderers must upload source textures only when media/resource keys change. Timeline-driven effects may update uniforms and draw, but must not call texImage2D or renderer.setImage from an effect that depends on settings/currentTime/keyframeGroups.",
    ).toBe(false);
  });

  it("requires workload targets for performance-sensitive schema controls", () => {
    const workloadTargets = new Set(appPerformance.workloadTargets);
    const sensitiveControls = collectToolcraftPerformanceSensitiveControls(appSchema);

    for (const { controlId, target } of sensitiveControls) {
      expect(
        workloadTargets,
        `${controlId} (${target}) looks performance-sensitive and must be listed in workloadTargets or deliberately removed from the app.`,
      ).toContain(target);
    }
  });

  it("requires each automated performance scenario to point at an app test", () => {
    const testSources = readSiblingAppTestSources();

    for (const scenario of appPerformance.scenarios) {
      if (!scenario.automated) {
        continue;
      }

      expect(
        testSources,
        `${scenario.id} must be backed by an app test named "${scenario.automatedTestName}".`,
      ).toContain(scenario.automatedTestName);
    }
  });

  it("requires each browser performance scenario to point at a fallback Playwright test", () => {
    const browserTestSources = readBrowserTestSources();

    for (const scenario of appPerformance.scenarios) {
      if (!scenario.browser) {
        continue;
      }

      expect(
        browserTestSources,
        `${scenario.id} must be backed by a fallback Playwright test named "${scenario.browserTestName}".`,
      ).toContain(scenario.browserTestName);
    }
  });

  it("rejects reused browser performance tests across scenarios", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "none",
        rendererWorkload: "none",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: prompt min change stays responsive",
            browser: true,
            browserTestName: "browser perf: prompt changes stay responsive",
            budget: { maxFrameGapMs: 80, maxInteractionMs: 500 },
            controlLabel: "Prompt",
            expectedObservable: "Prompt min edit updates product output.",
            fixture: "starter prompt fixture",
            id: "prompt-min-change",
            interaction: "control-change",
            target: "generation.prompt",
            values: { default: "Describe the effect", max: "Long prompt", min: "" },
            workload: true,
          },
          {
            automated: true,
            automatedTestName: "perf: prompt max change stays responsive",
            browser: true,
            browserTestName: "browser perf: prompt changes stay responsive",
            budget: { maxFrameGapMs: 80, maxInteractionMs: 500 },
            controlLabel: "Prompt",
            expectedObservable: "Prompt max edit updates product output.",
            fixture: "starter prompt fixture",
            id: "prompt-max-change",
            interaction: "control-change",
            target: "generation.prompt",
            values: { default: "Describe the effect", max: "Long prompt", min: "" },
            workload: true,
          },
        ],
        usesCustomRenderer: false,
        workloadTargets: ["generation.prompt"],
      }),
    ).toEqual(
      expect.arrayContaining([
        'prompt-max-change browserTestName "browser perf: prompt changes stay responsive" is already used by prompt-min-change. Give each performance scenario its own browser test so every control is actually exercised.',
      ]),
    );
  });

  it("fails custom renderer configs that omit real workload coverage", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "canvas-2d",
        rendererWorkload: "simple-composition",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: preview render stays under budget",
            browser: true,
            browserTestName: "browser perf: preview render stays interactive",
            budget: { maxPreviewMs: 100 },
            expectedObservable: "Preview renders without freezing.",
            fixture: "1600x1000 gradient fixture",
            id: "preview-render",
            interaction: "preview-render",
            workload: false,
          },
        ],
        usesCustomRenderer: true,
        workloadTargets: ["generation.prompt"],
      }),
    ).toEqual(
      expect.arrayContaining([
        "Custom renderers must include a control-drag performance scenario.",
        "generation.prompt must have min/default/max workload performance coverage.",
      ]),
    );
  });

  it("requires custom renderers to cover upload, output actions, and viewport stability", () => {
    const outputSchema = defineToolcraft({
      canvas: {
        enabled: true,
        size: { height: 1080, unit: "px", width: 1920 },
        sizing: { mode: "editable-output" },
        upload: true,
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                export: {
                  actions: [{ label: "Export PNG", value: "export-png" }],
                  target: "panel.actions",
                  type: "panelActions",
                },
                quality: {
                  defaultValue: 0.5,
                  label: "Quality",
                  max: 1,
                  min: 0,
                  target: "render.quality",
                  type: "slider",
                },
              },
            },
          ],
          title: "Renderer Controls",
        },
      },
    });

    expect(
      validateToolcraftPerformanceCoverage(outputSchema, {
        rendererStrategy: "canvas-2d",
        rendererWorkload: "simple-composition",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: preview render stays under budget",
            browser: true,
            browserTestName: "browser perf: preview render stays under budget",
            budget: { maxPreviewMs: 1000 },
            expectedObservable: "Preview renders without freezing.",
            fixture: "1920x1080 output fixture",
            id: "preview-render",
            interaction: "preview-render",
            workload: false,
          },
          {
            automated: true,
            automatedTestName: "perf: quality drag stays responsive",
            browser: true,
            browserTestName: "browser perf: quality drag stays responsive",
            budget: { maxFrameGapMs: 50, maxInteractionMs: 250 },
            controlLabel: "Quality",
            expectedObservable: "Dragging Quality remains responsive.",
            fixture: "1920x1080 output fixture",
            id: "quality-drag",
            interaction: "control-drag",
            target: "render.quality",
            values: { default: 0.5, max: 1, min: 0 },
            workload: true,
          },
        ],
        usesCustomRenderer: true,
        workloadTargets: ["render.quality"],
      }),
    ).toEqual(
      expect.arrayContaining([
        "Custom renderers must include a viewport-stability performance scenario.",
        "Custom renderers with canvas upload must include a media-import performance scenario.",
        "Output actions must include an export-copy performance scenario.",
      ]),
    );
  });

  it("requires keyframe custom renderers to cover viewport stability during keyframe interactions", () => {
    const keyframeSchema = defineToolcraft({
      canvas: {
        enabled: true,
        sizing: { mode: "intrinsic-media" },
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                intensity: {
                  defaultValue: 0.5,
                  label: "Intensity",
                  max: 1,
                  min: 0,
                  target: "render.intensity",
                  type: "slider",
                },
              },
              title: "Render",
            },
          ],
          title: "Render Controls",
        },
        timeline: { mode: "keyframes" },
      },
    });

    expect(
      validateToolcraftPerformanceCoverage(keyframeSchema, {
        rendererStrategy: "webgl",
        rendererWorkload: "simple-composition",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: preview render stays under budget",
            browser: true,
            browserTestName: "browser perf: preview render stays under budget",
            budget: { maxPreviewMs: 1000 },
            expectedObservable: "Preview renders without freezing.",
            fixture: "1440x1080 shader fixture",
            id: "preview-render",
            interaction: "preview-render",
            workload: false,
          },
          {
            automated: true,
            automatedTestName: "perf: intensity drag stays responsive",
            browser: true,
            browserTestName: "browser perf: intensity drag stays responsive",
            budget: { maxFrameGapMs: 80, maxInteractionMs: 500 },
            controlLabel: "Intensity",
            expectedObservable: "Dragging Intensity remains responsive.",
            fixture: "1440x1080 shader fixture",
            id: "intensity-drag",
            interaction: "control-drag",
            target: "render.intensity",
            values: { default: 0.5, max: 1, min: 0 },
            workload: true,
          },
          {
            automated: true,
            automatedTestName: "perf: viewport stays stable",
            browser: true,
            browserTestName: "browser perf: viewport stays stable",
            budget: { maxFrameGapMs: 80 },
            expectedObservable: "Changing controls does not move the canvas viewport.",
            fixture: "1440x1080 shader fixture",
            id: "viewport-stability",
            interaction: "viewport-stability",
            target: "render.intensity",
            workload: false,
          },
        ],
        usesCustomRenderer: true,
        workloadTargets: ["render.intensity"],
      }),
    ).toEqual(
      expect.arrayContaining([
        'Keyframe custom renderers must include a viewport-stability performance scenario with target "timeline.keyframes" that exercises zoom/radar, expanded keyframes, keyframe creation, and playback or scrubbing.',
      ]),
    );
  });

  it("requires layer custom renderers to cover viewport stability during layer interactions", () => {
    const layerSchema = defineToolcraft({
      canvas: {
        enabled: true,
        upload: true,
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                opacity: {
                  defaultValue: 1,
                  label: "Opacity",
                  max: 1,
                  min: 0,
                  target: "selectedLayer.opacity",
                  type: "slider",
                },
              },
              title: "Layer",
            },
          ],
          title: "Layer Controls",
        },
        layers: true,
      },
    });

    expect(
      validateToolcraftPerformanceCoverage(layerSchema, {
        rendererStrategy: "webgl",
        rendererWorkload: "simple-composition",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: preview render stays under budget",
            browser: true,
            browserTestName: "browser perf: preview render stays under budget",
            budget: { maxPreviewMs: 1000 },
            expectedObservable: "Preview renders without freezing.",
            fixture: "two-layer image fixture",
            id: "preview-render",
            interaction: "preview-render",
            workload: false,
          },
          {
            automated: true,
            automatedTestName: "perf: opacity drag stays responsive",
            browser: true,
            browserTestName: "browser perf: opacity drag stays responsive",
            budget: { maxFrameGapMs: 80, maxInteractionMs: 500 },
            controlLabel: "Opacity",
            expectedObservable: "Dragging selected layer opacity remains responsive.",
            fixture: "two-layer image fixture",
            id: "opacity-drag",
            interaction: "control-drag",
            target: "selectedLayer.opacity",
            values: { default: 1, max: 1, min: 0 },
            workload: true,
          },
          {
            automated: true,
            automatedTestName: "perf: viewport stays stable",
            browser: true,
            browserTestName: "browser perf: viewport stays stable",
            budget: { maxFrameGapMs: 80 },
            expectedObservable: "Changing controls does not move the canvas viewport.",
            fixture: "two-layer image fixture",
            id: "viewport-stability",
            interaction: "viewport-stability",
            target: "selectedLayer.opacity",
            workload: false,
          },
        ],
        usesCustomRenderer: true,
        workloadTargets: ["selectedLayer.opacity"],
      }),
    ).toEqual(
      expect.arrayContaining([
        'Layer-enabled custom renderers must include a viewport-stability performance scenario with target "layers.interactions" that exercises zoom/radar, layer selection, visibility, reorder or grouping, and selected-layer output stability.',
      ]),
    );
  });

  it("requires every visible non-action control to have performance coverage", () => {
    const rendererSchema = defineToolcraft({
      canvas: {
        enabled: true,
        size: { height: 1080, unit: "px", width: 1440 },
        sizing: { mode: "editable-output" },
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                depth: {
                  defaultValue: 50,
                  label: "Depth",
                  max: 100,
                  min: 0,
                  target: "shader.depth",
                  type: "slider",
                },
                gradient: {
                  defaultValue: "aurora",
                  label: "Gradient",
                  options: [
                    { label: "Aurora", value: "aurora" },
                    { label: "Prism", value: "prism" },
                  ],
                  target: "shader.gradient",
                  type: "select",
                },
                mode: {
                  defaultValue: "soft",
                  label: "Mode",
                  options: [
                    { label: "Soft", value: "soft" },
                    { label: "Sharp", value: "sharp" },
                  ],
                  target: "shader.mode",
                  type: "segmented",
                },
              },
              title: "Shader",
            },
          ],
          title: "Shader Controls",
        },
      },
    });

    expect(
      validateToolcraftPerformanceCoverage(rendererSchema, {
        rendererStrategy: "canvas-2d",
        rendererWorkload: "simple-composition",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: preview render stays under budget",
            browser: true,
            browserTestName: "browser perf: preview render stays under budget",
            budget: { maxPreviewMs: 1000 },
            expectedObservable: "Preview renders without freezing.",
            fixture: "1440x1080 shader fixture",
            id: "preview-render",
            interaction: "preview-render",
            workload: false,
          },
          {
            automated: true,
            automatedTestName: "perf: depth drag stays responsive",
            browser: true,
            browserTestName: "browser perf: depth drag stays responsive",
            budget: { maxFrameGapMs: 50, maxInteractionMs: 250 },
            controlLabel: "Depth",
            expectedObservable: "Dragging Depth remains responsive.",
            fixture: "1440x1080 shader fixture",
            id: "depth-drag",
            interaction: "control-drag",
            target: "shader.depth",
            values: { default: 50, max: 100, min: 0 },
            workload: true,
          },
          {
            automated: true,
            automatedTestName: "perf: viewport stays stable",
            browser: true,
            browserTestName: "browser perf: viewport stays stable",
            budget: { maxFrameGapMs: 50 },
            expectedObservable: "Canvas zoom and offset do not jump.",
            fixture: "1440x1080 shader fixture",
            id: "viewport-stability",
            interaction: "viewport-stability",
            workload: false,
          },
        ],
        usesCustomRenderer: true,
        workloadTargets: ["shader.depth"],
      }),
    ).toEqual(
      expect.arrayContaining([
        "shader.gradient must have a performance scenario because every visible control can affect app responsiveness.",
        "shader.mode must have a performance scenario because every visible control can affect app responsiveness.",
      ]),
    );
  });

  it("requires visible control performance coverage even without a custom renderer", () => {
    const controlsSchema = defineToolcraft({
      canvas: {
        enabled: true,
        sizing: { mode: "intrinsic-media" },
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                mode: {
                  defaultValue: "soft",
                  label: "Mode",
                  options: [
                    { label: "Soft", value: "soft" },
                    { label: "Sharp", value: "sharp" },
                  ],
                  target: "app.mode",
                  type: "select",
                },
              },
              title: "Display",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(
      validateToolcraftPerformanceCoverage(controlsSchema, {
        rendererStrategy: "none",
        rendererWorkload: "none",
        scenarios: [],
        usesCustomRenderer: false,
        workloadTargets: [],
      }),
    ).toEqual(
      expect.arrayContaining([
        "app.mode must have a performance scenario because every visible control can affect app responsiveness.",
      ]),
    );
  });

  it("requires budgets that match each performance interaction type", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "none",
        rendererWorkload: "none",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: char size drag stays responsive",
            browser: true,
            browserTestName: "browser perf: char size drag stays responsive",
            budget: { maxExportMs: 100 },
            expectedObservable: "Dragging Char Size remains responsive.",
            fixture: "1600x1000 transparent glyph fixture",
            id: "char-size-drag",
            interaction: "control-drag",
            target: "generation.prompt",
            values: { default: 12, max: 32, min: 4 },
            workload: true,
          },
          {
            automated: true,
            automatedTestName: "perf: export png stays under budget",
            browser: true,
            browserTestName: "browser perf: export png stays under budget",
            budget: { maxFrameGapMs: 50 },
            expectedObservable: "Export completes without blocking the UI.",
            fixture: "1920x1080 output fixture",
            id: "export-png",
            interaction: "export-copy",
            workload: false,
          },
          {
            automated: true,
            automatedTestName: "perf: preview render stays under budget",
            browser: true,
            browserTestName: "browser perf: preview render stays under budget",
            budget: { maxFrameGapMs: 50 },
            expectedObservable: "Preview renders without freezing.",
            fixture: "1920x1080 output fixture",
            id: "preview-render",
            interaction: "preview-render",
            workload: false,
          },
          {
            automated: true,
            automatedTestName: "perf: animation frame loop stays smooth",
            browser: true,
            browserTestName: "browser perf: animation frame loop stays smooth",
            budget: { maxFrameGapMs: 50 },
            expectedObservable: "Animation advances without frame stalls.",
            fixture: "animated output fixture",
            id: "animation-frame-loop",
            interaction: "animation-frame",
            workload: false,
          },
        ],
        usesCustomRenderer: false,
        workloadTargets: ["generation.prompt"],
      }),
    ).toEqual(
      expect.arrayContaining([
        "char-size-drag control-drag scenario must declare maxInteractionMs and maxFrameGapMs.",
        "export-png export-copy scenario must declare maxExportMs.",
        "preview-render preview-render scenario must declare maxPreviewMs or maxRenderMs.",
        "animation-frame-loop animation-frame scenario must declare maxLongTaskMs.",
      ]),
    );
  });

  it("rejects performance budgets that are too loose to catch lag", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "none",
        rendererWorkload: "none",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: char size drag stays responsive",
            browser: true,
            browserTestName: "browser perf: char size drag stays responsive",
            budget: { maxFrameGapMs: 1000, maxInteractionMs: 10000 },
            controlLabel: "Char Size",
            expectedObservable: "Dragging Char Size remains responsive.",
            fixture: "1600x1000 transparent glyph fixture",
            id: "char-size-drag",
            interaction: "control-drag",
            target: "generation.prompt",
            values: { default: 12, max: 32, min: 4 },
            workload: true,
          },
        ],
        usesCustomRenderer: false,
        workloadTargets: ["generation.prompt"],
      }),
    ).toEqual(
      expect.arrayContaining([
        "char-size-drag maxFrameGapMs budget must be <= 120ms, received 1000ms.",
        "char-size-drag maxInteractionMs budget must be <= 2000ms, received 10000ms.",
      ]),
    );
  });

  it("does not let load-profile smooth targets bypass required interaction budgets", () => {
    const schema = defineToolcraft({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                density: {
                  defaultValue: 4,
                  label: "Density",
                  max: 12,
                  min: 1,
                  performanceReason: "Density changes rendered output size.",
                  performanceRole: "workload",
                  target: "render.density",
                  type: "slider",
                },
              },
              title: "Render",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(
      validateToolcraftPerformanceCoverage(schema, {
        rendererStrategy: "none",
        rendererWorkload: "none",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: density drag stays responsive",
            browser: true,
            browserTestName: "browser perf: density drag stays responsive",
            budget: { maxFrameGapMs: 80 },
            controlLabel: "Density",
            expectedObservable: "Dragging Density updates product output without blocking the UI.",
            fixture: "density smooth target fixture",
            id: "density-drag",
            interaction: "control-drag",
            stressFixture: {
              kind: "max-value",
              loadProfile: {
                degradationStepPercent: 10,
                evidence: [
                  {
                    attemptedTarget: 12,
                    decision: "Keep 12 as experimental and guarantee smoothness through 11.",
                    measuredResult: "At density 12, maxFrameGapMs 148 exceeded the 80ms budget.",
                    optimizationAttempted:
                      "Cached expensive render inputs and coalesced preview work to requestAnimationFrame.",
                    result: "failed",
                    scenarioId: "density-drag",
                  },
                ],
                hardLimit: 12,
                metric: "numeric-max",
                smoothTarget: 11,
                smoothTargetRatio: 0.9,
                target: "render.density",
                userFacingRange: "experimental-above-smooth",
              },
              reason: "Density 11 is the measured smooth target after hard-limit testing.",
              value: 11,
            },
            target: "render.density",
            values: { default: 4, max: 12, min: 1 },
            workload: true,
          },
        ],
        usesCustomRenderer: false,
        workloadTargets: ["render.density"],
      }),
    ).toContain("density-drag control-drag scenario must declare maxInteractionMs.");
  });

  it("requires real browser interaction metadata for control performance scenarios", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, {
        rendererStrategy: "none",
        rendererWorkload: "none",
        scenarios: [
          {
            automated: true,
            automatedTestName: "perf: char size drag stays responsive",
            browser: true,
            browserTestName: "browser perf: char size drag stays responsive",
            budget: { maxFrameGapMs: 50, maxInteractionMs: 250 },
            expectedObservable: "Dragging Char Size remains responsive.",
            fixture: "1600x1000 transparent glyph fixture",
            id: "char-size-drag",
            interaction: "control-drag",
            target: "generation.prompt",
            values: { default: 12, max: 32, min: 4 },
            workload: true,
          },
        ],
        usesCustomRenderer: false,
        workloadTargets: ["generation.prompt"],
      }),
    ).toEqual(
      expect.arrayContaining([
        "char-size-drag control-drag scenario must declare controlLabel or uiSelector for its real browser interaction.",
      ]),
    );
  });
});
