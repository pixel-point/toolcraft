import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";

const currentFileName = basename(fileURLToPath(import.meta.url));
const e2eDir = dirname(fileURLToPath(import.meta.url));

type BrowserTestSource = {
  fileName: string;
  source: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripJsComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function hasRealLayerRowInteraction(source: string): boolean {
  return /data-layer-id|data-template-layer-name|selectLayerByName\s*\(|layerRowByName\s*\(|getByRole\s*\(\s*(["'`])option\1/i.test(
    source,
  );
}

function hasRealLayerVisibilityInteraction(source: string): boolean {
  return /toggleLayerVisibilityByName\s*\(|getByRole\s*\([\s\S]*?(Hide|Show|Disable|Enable).*layer|aria-label[\s\S]*?(Hide|Show|Disable|Enable)/i.test(
    source,
  );
}

function hasRealLayerDragInteraction(source: string): boolean {
  return /\.dragTo\s*\(|page\.mouse\.(?:down|move|up)\s*\(|dragLayer(?:Before|After|ToGroup|ByName)?\s*\(/i.test(
    source,
  );
}

function readSiblingBrowserTestSources(): BrowserTestSource[] {
  return readdirSync(e2eDir)
    .filter((fileName) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(fileName))
    .filter((fileName) => fileName !== currentFileName)
    .map((fileName) => ({
      fileName,
      source: readFileSync(join(e2eDir, fileName), "utf8"),
    }));
}

function findNamedBrowserTestSource(
  sources: readonly BrowserTestSource[],
  testName: string,
): string | undefined {
  const testStartPattern = new RegExp(
    `(?:test|it)(?:\\.[\\w]+)?\\(\\s*(["'\`])${escapeRegExp(testName)}\\1`,
  );
  const nextTestPattern = /\n\s*(?:test|it)(?:\.[\w]+)?\(\s*["'`]/;

  for (const { source } of sources) {
    const cleanSource = stripJsComments(source);
    const match = testStartPattern.exec(cleanSource);
    if (!match) {
      continue;
    }

    const startIndex = match.index;
    const afterStart = cleanSource.slice(startIndex + 1);
    const nextMatchIndex = afterStart.search(nextTestPattern);

    return cleanSource.slice(
      startIndex,
      nextMatchIndex === -1 ? undefined : startIndex + 1 + nextMatchIndex,
    );
  }

  return undefined;
}

function getDiscreteControlLabels(): Set<string> {
  const labels = new Set<string>();

  for (const section of appSchema.panels.controls?.sections ?? []) {
    for (const control of Object.values(section.controls)) {
      if (
        (control.type === "slider" || control.type === "rangeSlider") &&
        control.variant === "discrete" &&
        typeof control.label === "string"
      ) {
        labels.add(control.label);
      }
    }
  }

  return labels;
}

function getScenarioBudgetAssertionPattern(scenarioId: string): RegExp {
  return new RegExp(
    `expectToolcraftScenarioPerformanceBudget\\s*\\([\\s\\S]*?,\\s*(?:appPerformance|appPerformance)\\s*,\\s*(["'\`])${escapeRegExp(
      scenarioId,
    )}\\1`,
  );
}

function getScenarioStressFixturePattern(scenarioId: string): RegExp {
  return new RegExp(
    `(?:getToolcraftPerformanceStressValue(?:\\s*<[^>]+>)?\\s*\\(\\s*(?:appPerformance|appPerformance)|dragToolcraftSliderToPerformanceStressValue\\s*\\([\\s\\S]*?(?:appPerformance|appPerformance)|applyToolcraftPerformanceStressFixture\\s*\\(\\s*page\\s*,\\s*(?:appPerformance|appPerformance))\\s*,\\s*(["'\`])${escapeRegExp(
      scenarioId,
    )}\\1`,
  );
}

function getScenarioWorkloadFixturePattern(scenarioId: string): RegExp {
  return new RegExp(
    `(?:getToolcraftPerformanceWorkloadValue(?:\\s*<[^>]+>)?\\s*\\(\\s*(?:appPerformance|appPerformance)|applyToolcraftPerformanceWorkloadFixture\\s*\\(\\s*page\\s*,\\s*(?:appPerformance|appPerformance))\\s*,\\s*(["'\`])${escapeRegExp(
      scenarioId,
    )}\\1`,
  );
}

function getScenarioCustomStressFixturePattern(scenarioId: string): RegExp {
  return new RegExp(
    `applyToolcraftPerformanceStressFixture\\s*\\(\\s*page\\s*,\\s*(?:appPerformance|appPerformance)\\s*,\\s*(["'\`])${escapeRegExp(
      scenarioId,
    )}\\1`,
  );
}

function getScenarioCustomWorkloadFixturePattern(scenarioId: string): RegExp {
  return new RegExp(
    `applyToolcraftPerformanceWorkloadFixture\\s*\\(\\s*page\\s*,\\s*(?:appPerformance|appPerformance)\\s*,\\s*(["'\`])${escapeRegExp(
      scenarioId,
    )}\\1`,
  );
}

function getScenarioSliderStressValuePattern(scenarioId: string): RegExp {
  return new RegExp(
    `dragToolcraftSliderToPerformanceStressValue\\s*\\([\\s\\S]*?(?:appPerformance|appPerformance)\\s*,\\s*(["'\`])${escapeRegExp(
      scenarioId,
    )}\\1`,
  );
}

function fixtureValueUsesRenderScale(value: unknown, pathPrefix = ""): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.entries(value).some(([key, itemValue]) => {
    const itemPath = pathPrefix ? `${pathPrefix}.${key}` : key;

    return (
      /^(?:canvas\.)?renderScale$|(?:^|[._-])resolutionScale$/i.test(itemPath) ||
      fixtureValueUsesRenderScale(itemValue, itemPath)
    );
  });
}

function scenarioUsesRenderScaleFixture(
  scenario: (typeof appPerformance.scenarios)[number],
): boolean {
  return (
    scenario.target === "canvas.renderScale" ||
    fixtureValueUsesRenderScale(scenario.stressFixture?.value) ||
    fixtureValueUsesRenderScale(scenario.workloadFixture?.value)
  );
}

function scenarioUsesLoadProfile(
  scenario: (typeof appPerformance.scenarios)[number],
): boolean {
  return Boolean(scenario.stressFixture?.loadProfile || scenario.workloadFixture?.loadProfile);
}

function getFirstMatchIndex(source: string, pattern: RegExp): number {
  const match = pattern.exec(source);
  return match?.index ?? -1;
}

test("browser perf: performance matrix points at real fallback browser tests", () => {
  const browserTestSources = readSiblingBrowserTestSources();

  for (const scenario of appPerformance.scenarios) {
    if (!scenario.browser) {
      continue;
    }

    expect(
      Boolean(findNamedBrowserTestSource(browserTestSources, scenario.browserTestName)),
      `${scenario.id} must be backed by a fallback browser performance test named "${scenario.browserTestName}".`,
    ).toBe(true);
  }
});

test("browser perf: performance tests use real Toolcraft interactions", () => {
  if (appPerformance.scenarios.length === 0) {
    return;
  }

  const browserTestSources = readSiblingBrowserTestSources();
  const discreteControlLabels = getDiscreteControlLabels();

  for (const scenario of appPerformance.scenarios) {
    const browserTestSource = findNamedBrowserTestSource(
      browserTestSources,
      scenario.browserTestName,
    );

    expect(
      browserTestSource,
      `${scenario.id} must be backed by a browser performance test named "${scenario.browserTestName}".`,
    ).toBeDefined();

    if (!browserTestSource) {
      continue;
    }

    if (scenario.workload || scenario.stress === true || scenario.stressFixture) {
      expect(
        scenario.stressFixture,
        `${scenario.id} stress scenario must declare stressFixture so browser tests cannot use toy inputs.`,
      ).toBeDefined();
      expect(
        browserTestSource,
        `${scenario.id} must read the declared stress fixture with getToolcraftPerformanceStressValue(appPerformance, "${scenario.id}") before measuring performance.`,
      ).toMatch(getScenarioStressFixturePattern(scenario.id));

      if (
        scenario.stressFixture?.kind === "custom" &&
        typeof scenario.stressFixture.value === "object" &&
        scenario.stressFixture.value !== null &&
        !Array.isArray(scenario.stressFixture.value)
      ) {
        expect(
          browserTestSource,
          `${scenario.id} custom stress fixture must be applied with applyToolcraftPerformanceStressFixture so every heavy-state key is mapped through the real UI before measurement.`,
        ).toMatch(getScenarioCustomStressFixturePattern(scenario.id));
      }
    }

    if (scenario.workloadFixture) {
      const workloadFixtureIndex = getFirstMatchIndex(
        browserTestSource,
        getScenarioWorkloadFixturePattern(scenario.id),
      );
      const stressFixtureIndex = getFirstMatchIndex(
        browserTestSource,
        getScenarioStressFixturePattern(scenario.id),
      );
      const budgetAssertionIndex = getFirstMatchIndex(
        browserTestSource,
        getScenarioBudgetAssertionPattern(scenario.id),
      );

      expect(
        browserTestSource,
        `${scenario.id} must apply the declared workloadFixture with getToolcraftPerformanceWorkloadValue(appPerformance, "${scenario.id}") or applyToolcraftPerformanceWorkloadFixture before measuring performance.`,
      ).toMatch(getScenarioWorkloadFixturePattern(scenario.id));
      expect(
        workloadFixtureIndex,
        `${scenario.id} must apply workloadFixture before stressFixture so the measured control runs inside the heavy app baseline.`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        stressFixtureIndex,
        `${scenario.id} must read/apply stressFixture after workloadFixture.`,
      ).toBeGreaterThan(workloadFixtureIndex);
      expect(
        budgetAssertionIndex,
        `${scenario.id} must assert budget only after workloadFixture is applied.`,
      ).toBeGreaterThan(workloadFixtureIndex);

      if (
        scenario.workloadFixture.kind === "custom" &&
        typeof scenario.workloadFixture.value === "object" &&
        scenario.workloadFixture.value !== null &&
        !Array.isArray(scenario.workloadFixture.value)
      ) {
        expect(
          browserTestSource,
          `${scenario.id} custom workload fixture must be applied with applyToolcraftPerformanceWorkloadFixture so every baseline-state key is mapped through the real UI before measurement.`,
        ).toMatch(getScenarioCustomWorkloadFixturePattern(scenario.id));
      }
    }

    if (scenario.interaction === "control-drag") {
      expect(
        browserTestSource,
        `${scenario.id} must measure a real Toolcraft pointer drag instead of filling a hidden/numeric editor.`,
      ).toMatch(/dragToolcraftSliderByLabel\s*\(/);

      if (scenario.controlLabel) {
        expect(
          browserTestSource,
          `${scenario.id} must drag the declared control label "${scenario.controlLabel}".`,
        ).toMatch(
          new RegExp(
            `dragToolcraftSliderByLabel\\s*\\([\\s\\S]*?(["'\`])${escapeRegExp(
              scenario.controlLabel,
            )}\\1`,
          ),
        );
      }

      if (scenario.controlLabel && discreteControlLabels.has(scenario.controlLabel)) {
        expect(
          browserTestSource,
          `${scenario.id} drags discrete slider "${scenario.controlLabel}" and must verify Toolcraft marker-budget behavior plus smooth drag.`,
        ).toMatch(/expectToolcraftDiscreteSliderDragSmoothness\s*\(/);
      }

      if (scenario.workload && scenario.controlLabel) {
        expect(
          browserTestSource,
          `${scenario.id} workload slider drags must apply the exact stressFixture.value with dragToolcraftSliderToPerformanceStressValue instead of hand-dividing by max or typing a ratio.`,
        ).toMatch(getScenarioSliderStressValuePattern(scenario.id));
      }
    }

    if (scenarioUsesRenderScaleFixture(scenario)) {
      expect(
        browserTestSource,
        `${scenario.id} uses canvas.renderScale and must prove the selected Resolution scale changes backing canvas pixels instead of only changing declarative state.`,
      ).toMatch(/expectToolcraftCanvasBackingPixelsForRenderScale\s*\(/);
    }

    if (scenarioUsesLoadProfile(scenario)) {
      expect(
        browserTestSource,
        `${scenario.id} declares a loadProfile and must apply the documented smoothTarget through appPerformance fixtures instead of recalculating a smaller browser-only target.`,
      ).toMatch(
        scenario.workloadFixture
          ? getScenarioWorkloadFixturePattern(scenario.id)
          : getScenarioStressFixturePattern(scenario.id),
      );
      expect(
        browserTestSource,
        `${scenario.id} declares a loadProfile and must keep budget assertions tied to app-performance.ts.`,
      ).toMatch(getScenarioBudgetAssertionPattern(scenario.id));
    }

    if (scenario.interaction === "control-change") {
      expect(
        browserTestSource,
        `${scenario.id} must change the declared control through the browser UI.`,
      ).toMatch(/\.fill\s*\(|\.pressSequentially\s*\(|\.selectOption\s*\(|getByRole\s*\([\s\S]*?\.click\s*\(/);
    }

    if (scenario.uiSelector) {
      expect(
        browserTestSource,
        `${scenario.id} must interact with the declared UI selector "${scenario.uiSelector}".`,
      ).toContain(scenario.uiSelector);
    }

    expect(
      browserTestSource,
      `${scenario.id} must measure browser responsiveness with measureToolcraftInteraction.`,
    ).toMatch(
      /measureToolcraftInteraction\s*\(|measureToolcraftAnimationFrames\s*\(|expectToolcraftCanvasViewportStable\s*\(/,
    );

    if (scenario.interaction === "viewport-stability") {
      expect(
        browserTestSource,
        `${scenario.id} must use expectToolcraftCanvasViewportStable to catch canvas zoom/offset jumps.`,
      ).toMatch(/expectToolcraftCanvasViewportStable\s*\(/);

      if (scenario.target === "timeline.keyframes") {
        expect(
          browserTestSource,
          `${scenario.id} must exercise toolbar zoom or radar before checking keyframe viewport stability.`,
        ).toMatch(/Zoom in|Zoom out|Center canvas|canvas\.zoom|canvas\.center/);
        expect(
          browserTestSource,
          `${scenario.id} must open the expanded keyframe editor while checking viewport stability.`,
        ).toMatch(/Expand timeline panel|timeline\.setExpanded|timeline-expanded/);
        expect(
          browserTestSource,
          `${scenario.id} must create or update at least one keyframe while checking viewport stability.`,
        ).toMatch(/Add .* keyframe|Disable .* keyframes|timeline-keyframe-row/);
        expect(
          browserTestSource,
          `${scenario.id} must scrub or play the timeline while checking viewport stability.`,
        ).toMatch(/Playback position|Play playback|Pause playback|timeline\.setCurrentTime/);
      }

      if (scenario.target === "layers.interactions") {
        expect(
          browserTestSource,
          `${scenario.id} must exercise toolbar zoom or radar before checking layer viewport stability.`,
        ).toMatch(/Zoom in|Zoom out|Center canvas|canvas\.zoom|canvas\.center/);
        expect(
          hasRealLayerRowInteraction(browserTestSource),
          `${scenario.id} must select real LayersPanel rows while checking viewport stability.`,
        ).toBe(true);
        expect(
          hasRealLayerVisibilityInteraction(browserTestSource),
          `${scenario.id} must toggle real layer visibility while checking viewport stability.`,
        ).toBe(true);
        expect(
          hasRealLayerDragInteraction(browserTestSource),
          `${scenario.id} must drag real layer rows for reorder or grouping while checking viewport stability.`,
        ).toBe(true);
        expect(
          browserTestSource,
          `${scenario.id} must assert selected-layer or product output after layer interactions.`,
        ).toMatch(/selected layer|selectedLayer|product-output|rendered-pixels|canvas|export|output/i);
      }
    }

    if (scenario.interaction === "animation-frame") {
      expect(
        browserTestSource,
        `${scenario.id} must use measureToolcraftAnimationFrames so animated renderers are sampled for at least 120 frames.`,
      ).toMatch(/measureToolcraftAnimationFrames\s*\(/);
      expect(
        browserTestSource,
        `${scenario.id} must not satisfy animation coverage with a short waitForToolcraftAnimationFrames probe.`,
      ).not.toMatch(/waitForToolcraftAnimationFrames\s*\(\s*page\s*,\s*(?:[1-9]|[1-9]\d|1[01]\d)\s*\)/);
    }

    if (scenario.interaction === "animation-viewport-drag") {
      expect(
        browserTestSource,
        `${scenario.id} must measure a real canvas viewport drag while the renderer is animated.`,
      ).toMatch(/measureToolcraftInteraction\s*\([\s\S]*dragToolcraftCanvasViewport\s*\(/);
      expect(
        browserTestSource,
        `${scenario.id} must not fake animated viewport coverage with toolbar zoom or direct canvas commands.`,
      ).not.toMatch(/canvas\.setOffset|canvas\.panBy|canvas\.zoom|Zoom in|Zoom out|Center canvas/);
    }

    if (scenario.interaction === "timeline-playback") {
      expect(
        browserTestSource,
        `${scenario.id} must use the real timeline playback UI while measuring frames.`,
      ).toMatch(/measureToolcraftInteraction\s*\([\s\S]*(Play playback|Pause playback|timeline-playback|data-slot=["']timeline-playback)/);
      expect(
        browserTestSource,
        `${scenario.id} must not satisfy timeline playback performance by dispatching timeline state directly.`,
      ).not.toMatch(/timeline\.setCurrentTime|timeline\.setPlaying|timeline\.play|timeline\.pause/);
    }

    if (scenario.interaction === "timeline-scrub") {
      expect(
        browserTestSource,
        `${scenario.id} must scrub the real timeline UI while measuring interaction responsiveness.`,
      ).toMatch(/measureToolcraftInteraction\s*\([\s\S]*(Playback position|timeline-playback-handle|data-slot=["']timeline-playback-handle|page\.mouse\.(?:down|move|up))/);
      expect(
        browserTestSource,
        `${scenario.id} must not satisfy timeline scrub performance by setting timeline time directly.`,
      ).not.toMatch(/timeline\.setCurrentTime|canvas\.setCurrentTime/);
    }

    if (scenario.interaction === "mask-drag") {
      expect(
        browserTestSource,
        `${scenario.id} must measure a real canvas handle/mask drag.`,
      ).toMatch(/measureToolcraftInteraction\s*\([\s\S]*dragCanvasHandle\s*\(/);
      expect(
        browserTestSource,
        `${scenario.id} must not fake mask drag coverage with direct runtime state mutation.`,
      ).not.toMatch(/mask\.(?:set|update|move)|canvas\.setOffset|canvas\.panBy/);
    }

    if (scenario.interaction === "viewport-zoom-stress") {
      expect(
        browserTestSource,
        `${scenario.id} must measure real toolbar zoom while sampling frame gaps.`,
      ).toMatch(/measureToolcraftInteraction\s*\([\s\S]*zoomToolcraftCanvasViewport\s*\(/);
      expect(
        browserTestSource,
        `${scenario.id} must not fake zoom stress with direct runtime canvas commands.`,
      ).not.toMatch(/canvas\.setZoom|canvas\.zoom|canvas\.setScale|canvas\.setOffset|canvas\.panBy/);
    }

    expect(
      browserTestSource,
      `${scenario.id} must assert product or UI output after the measured interaction so a no-op control cannot pass.`,
    ).toMatch(/await\s+expect\s*\(|expect\s*\(/);

    expect(
      browserTestSource,
      `${scenario.id} must assert its typed budget through expectToolcraftScenarioPerformanceBudget(..., appPerformance, "${scenario.id}") so browser thresholds cannot drift from app-performance.ts.`,
    ).toMatch(getScenarioBudgetAssertionPattern(scenario.id));
  }
});

test("browser perf: declared renderer layer selectors are present", async ({ page }) => {
  if (!appPerformance.usesCustomRenderer) {
    return;
  }

  const visibleLayers =
    appPerformance.rendererTechnique?.layers?.filter((layer) => layer.uiSelector) ?? [];

  await page.goto("/");

  for (const layer of visibleLayers) {
    await expect(
      page.locator(layer.uiSelector!).first(),
      `renderer layer "${layer.id}" should exist at ${layer.uiSelector}`,
    ).toBeVisible();
  }
});
