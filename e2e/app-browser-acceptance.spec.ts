import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import {
  getRequiredToolcraftControlPartCoverage,
  appAcceptance,
  appTransferMode,
} from "../src/app/app-acceptance";
import { appSchema } from "../src/app/app-schema";
import { expectNoForbiddenCanvasUi } from "./canvas-handle-helpers";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-helpers";
import {
  expectToolcraftProductObservableToChange,
  getToolcraftProductObservableSnapshot,
} from "./product-observable-helpers";

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

function hasLayerGroupTarget(source: string): boolean {
  return /data-template-layer-kind[\s\S]*group|groupLayerByName\s*\(|dragLayerToGroup\s*\(|getByRole\s*\(\s*(["'`])option\1[\s\S]*Group/i.test(
    source,
  );
}

function readSiblingBrowserTestSources(): BrowserTestSource[] {
  return readdirSync(e2eDir)
    .filter((fileName) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(fileName))
    .filter((fileName) => fileName !== currentFileName)
    .map((fileName) => ({
      fileName,
      source: stripJsComments(readFileSync(join(e2eDir, fileName), "utf8")),
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
    const match = testStartPattern.exec(source);
    if (!match) {
      continue;
    }

    const startIndex = match.index;
    const afterStart = source.slice(startIndex + 1);
    const nextMatchIndex = afterStart.search(nextTestPattern);

    return source.slice(
      startIndex,
      nextMatchIndex === -1 ? undefined : startIndex + 1 + nextMatchIndex,
    );
  }

  return undefined;
}

function getCanvasHandleEntries() {
  return appAcceptance.filter((entry) => entry.kind === "canvas-handle");
}

function getDiscreteSliderControls() {
  return (appSchema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls)
      .filter(
        ([, control]) =>
          (control.type === "slider" || control.type === "rangeSlider") &&
          control.variant === "discrete",
      )
      .map(([id, control]) => ({
        control,
        shouldRenderMarkers: shouldInlineDiscreteSliderRenderMarkers(section, id, control),
      })),
  );
}

function getStepPositionCount(control: {
  max?: number;
  min?: number;
  step?: number;
}): number | undefined {
  if (
    typeof control.step !== "number" ||
    typeof control.min !== "number" ||
    typeof control.max !== "number" ||
    !Number.isFinite(control.step) ||
    !Number.isFinite(control.min) ||
    !Number.isFinite(control.max) ||
    control.step <= 0 ||
    control.max <= control.min
  ) {
    return undefined;
  }

  const rawStepCount = (control.max - control.min) / control.step;
  const roundedStepCount = Math.round(rawStepCount);
  const intervalCount =
    Math.abs(rawStepCount - roundedStepCount) < Number.EPSILON * 100
      ? roundedStepCount
      : Math.floor(rawStepCount) + 1;

  return Math.max(2, intervalCount + 1);
}

function isSliderLikeControl(control: { type?: string } | undefined): boolean {
  return control?.type === "slider" || control?.type === "rangeSlider";
}

function shouldInlineDiscreteSliderRenderMarkers(
  section: NonNullable<typeof appSchema.panels.controls>["sections"][number],
  id: string,
  control: { max?: number; min?: number; step?: number },
): boolean {
  const positionCount = getStepPositionCount(control);

  if (!positionCount || positionCount <= 20) {
    return true;
  }

  const inlineSliderGroup = section.layoutGroups?.find(
    (layoutGroup) =>
      layoutGroup.layout === "inline" &&
      layoutGroup.columns === 2 &&
      layoutGroup.controls.length === 2 &&
      layoutGroup.controls.includes(id) &&
      layoutGroup.controls.every((controlId) =>
        isSliderLikeControl(section.controls[controlId]),
      ),
  );

  return !inlineSliderGroup;
}

function getSegmentedControls() {
  return (appSchema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.values(section.controls).filter((control) => control.type === "segmented"),
  );
}

function getCompoundPartControls() {
  return (appSchema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.values(section.controls).filter(
      (control) => getRequiredToolcraftControlPartCoverage(control).length > 0,
    ),
  );
}

function getTimelineCoverageEntries(coverage: "keyframes" | "playback") {
  return appAcceptance.filter((entry) => entry.timelineCoverage === coverage);
}

function getLayerCoverageEntries() {
  return appAcceptance.filter((entry) => entry.layerCoverage);
}

function getReferenceCoverageEntry(coverage: string) {
  return appAcceptance.find((entry) => entry.referenceCoverage === coverage);
}

function requiresProductObservableProof(entry: (typeof appAcceptance)[number]): boolean {
  return (
    entry.evidence === "product-output" ||
    entry.evidence === "rendered-pixels" ||
    entry.evidence === "timeline-output"
  );
}

function hasProductObservableHelper(source: string): boolean {
  return /expectToolcraftProductObservableToChange\s*\(|getToolcraftProductObservableSnapshot\s*\(/.test(
    source,
  );
}

test("browser acceptance matrix points at real fallback Playwright tests", () => {
  const browserTestSources = readSiblingBrowserTestSources();

  for (const entry of appAcceptance) {
    if (!entry.browser) {
      continue;
    }

    expect(
      Boolean(findNamedBrowserTestSource(browserTestSources, entry.browserTestName)),
      `${entry.id} must be backed by a fallback Playwright test named "${entry.browserTestName}".`,
    ).toBe(true);
  }
});

test("browser product-output rows use the shared product observable helper", () => {
  const browserTestSources = readSiblingBrowserTestSources();

  for (const entry of appAcceptance) {
    if (!entry.browser || !requiresProductObservableProof(entry)) {
      continue;
    }

    const browserTestSource = findNamedBrowserTestSource(
      browserTestSources,
      entry.browserTestName,
    );

    expect(
      browserTestSource,
      `${entry.id} must be backed by browser test "${entry.browserTestName}".`,
    ).toBeDefined();

    if (!browserTestSource) {
      continue;
    }

    expect(
      hasProductObservableHelper(browserTestSource),
      `${entry.id} must use expectToolcraftProductObservableToChange or getToolcraftProductObservableSnapshot so the test proves real product output changed.`,
    ).toBe(true);
  }
});

test("browser renders the Toolcraft template shell instead of a reference iframe shell", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();

  if (appSchema.assembly.surfaces.canvas.enabled) {
    await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
  }

  const nonCanvasIframeCount = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll("iframe")).filter(
        (frame) => !frame.closest("[data-toolcraft-canvas-slot]"),
      ).length,
  );

  expect(
    nonCanvasIframeCount,
    "Reference iframes may not replace the Toolcraft shell. Preserve reference output inside ToolcraftApp canvasContent.",
  ).toBe(0);
});

test("browser preserves the Toolcraft canvas backing surface", async ({ page }) => {
  if (!appSchema.assembly.surfaces.canvas.enabled) {
    return;
  }

  await page.goto("/");

  const canvasViewport = page.getByRole("application", { name: "Canvas viewport" });

  await expect(canvasViewport).toBeVisible();

  const backgroundColor = await canvasViewport.evaluate((element) =>
    window.getComputedStyle(element).backgroundColor,
  );

  expect(
    backgroundColor,
    "The runtime CanvasShell backing must stay visible. Product renderers may customize their own output background, but they must not hide or make the workspace shell transparent.",
  ).not.toMatch(/^(?:transparent|rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\))$/i);
});

test("browser canvas contains product output without app UI controls or CTA copy", async ({
  page,
}) => {
  if (!appSchema.assembly.surfaces.canvas.enabled) {
    return;
  }

  await page.goto("/");
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
  await expectNoForbiddenCanvasUi(page);
});

test("product observable helper catches changed and unchanged output", async ({ page }) => {
  await page.setContent(`
    <div data-toolcraft-product-output>Before</div>
    <button type="button" id="change-output">Change output</button>
  `);

  const snapshot = await getToolcraftProductObservableSnapshot(page);

  expect(
    snapshot,
    "The product observable helper should read marked product output.",
  ).toContain("Before");

  await expectToolcraftProductObservableToChange(page, async () => {
    await page.locator("#change-output").evaluate((button) => {
      button.previousElementSibling!.textContent = "After";
    });
  });

  await expect(
    expectToolcraftProductObservableToChange(page, async () => {}, {
      timeoutMs: 100,
    }),
  ).rejects.toThrow(/Product output should change/);
});

test("canvas no-UI helper rejects unclassified canvas text", async ({ page }) => {
  await page.setContent(`
    <div data-toolcraft-canvas-world>
      <div>Click to upload an image</div>
    </div>
  `);

  await expect(expectNoForbiddenCanvasUi(page)).rejects.toThrow(
    /Canvas text must be product output/,
  );

  await page.setContent(`
    <div data-toolcraft-canvas-world>
      <div data-toolcraft-product-output>ASCII output</div>
    </div>
  `);

  await expectNoForbiddenCanvasUi(page);
});

test("browser canvas handle entries use handle helpers and no forbidden canvas UI check", () => {
  const handleEntries = getCanvasHandleEntries();
  if (handleEntries.length === 0) {
    return;
  }

  const browserTestSources = readSiblingBrowserTestSources();

  for (const entry of handleEntries) {
    const browserTestSource = findNamedBrowserTestSource(
      browserTestSources,
      entry.browserTestName,
    );

    expect(
      browserTestSource,
      `${entry.id} must be backed by a fallback Playwright test named "${entry.browserTestName}".`,
    ).toBeDefined();

    if (!browserTestSource) {
      continue;
    }

    expect(
      browserTestSource,
      `${entry.id} must drag its declared canvas handle "${entry.canvasHandle?.testId}".`,
    ).toMatch(
      new RegExp(
        `dragCanvasHandle\\s*\\([\\s\\S]*?(["'\`])${escapeRegExp(
          entry.canvasHandle?.testId ?? "",
        )}\\1`,
      ),
    );

    expect(
      browserTestSource,
      `${entry.id} must verify canvas contains no forbidden app UI.`,
    ).toMatch(/expectNoForbiddenCanvasUi\s*\(/);

    expect(
      browserTestSource,
      `${entry.id} must verify canvas handles stay in the Toolcraft visual language.`,
    ).toMatch(/expectCanvasHandlesUseToolcraftVisualLanguage\s*\(/);

    expect(
      browserTestSource,
      `${entry.id} must verify the handle is excluded from export or copied output.`,
    ).toContain(entry.canvasHandle?.exportCleanTestName ?? "");

    expect(
      browserTestSource,
      `${entry.id} must use expectExportExcludesCanvasHandles for export-clean coverage.`,
    ).toMatch(/expectExportExcludesCanvasHandles\s*\(/);
  }
});

test("browser discrete slider entries verify Toolcraft variant and markers", () => {
  const discreteControls = getDiscreteSliderControls();
  if (discreteControls.length === 0) {
    return;
  }

  const browserTestSources = readSiblingBrowserTestSources();

  for (const { control, shouldRenderMarkers } of discreteControls) {
    const entry = appAcceptance.find(
      (acceptanceEntry) =>
        acceptanceEntry.kind === "control" && acceptanceEntry.target === control.target,
    );

    expect(
      entry,
      `${control.target} must have acceptance coverage before its discrete slider browser test can be checked.`,
    ).toBeDefined();

    if (!entry) {
      continue;
    }

    const browserTestSource = findNamedBrowserTestSource(
      browserTestSources,
      entry.browserTestName,
    );

    expect(
      browserTestSource,
      `${control.target} must be backed by browser test "${entry.browserTestName}".`,
    ).toBeDefined();

    if (!browserTestSource) {
      continue;
    }

    expect(
      browserTestSource,
      `${control.target} discrete browser test must assert the Toolcraft discrete variant.`,
    ).toMatch(/data-variant/);

    expect(
      browserTestSource,
      `${control.target} discrete browser test must assert the expected discrete variant value.`,
    ).toMatch(/discrete/);

    if (shouldRenderMarkers) {
      expect(
        browserTestSource,
        `${control.target} discrete browser test must assert hover markers render.`,
      ).toMatch(/slider-marker/);
    } else {
      expect(
        browserTestSource,
        `${control.target} half-width over-budget discrete browser test must assert markers are intentionally hidden.`,
      ).toMatch(/expectMarkers\s*:\s*false|toHaveCount\s*\(\s*0\s*\)/);
    }

    expect(
      browserTestSource,
      `${control.target} discrete browser test must verify smooth drag with the Toolcraft helper.`,
    ).toMatch(/expectToolcraftDiscreteSliderDragSmoothness\s*\(/);
  }
});

test("browser segmented entries verify cell padding and no label collisions", () => {
  const segmentedControls = getSegmentedControls();
  if (segmentedControls.length === 0) {
    return;
  }

  const browserTestSources = readSiblingBrowserTestSources();

  for (const control of segmentedControls) {
    const entry = appAcceptance.find(
      (acceptanceEntry) =>
        acceptanceEntry.kind === "control" && acceptanceEntry.target === control.target,
    );

    expect(
      entry,
      `${control.target} must have acceptance coverage before its segmented browser test can be checked.`,
    ).toBeDefined();

    if (!entry) {
      continue;
    }

    const browserTestSource = findNamedBrowserTestSource(
      browserTestSources,
      entry.browserTestName,
    );

    expect(
      browserTestSource,
      `${control.target} must be backed by browser test "${entry.browserTestName}".`,
    ).toBeDefined();

    if (!browserTestSource) {
      continue;
    }

    expect(
      browserTestSource,
      `${control.target} segmented browser test must verify cell padding and label collisions.`,
    ).toMatch(/expectToolcraftSegmentedControlCellsPreservePadding\s*\(/);
  }
});

test("browser compound control entries name every required value part", () => {
  const compoundControls = getCompoundPartControls();
  if (compoundControls.length === 0) {
    return;
  }

  const browserTestSources = readSiblingBrowserTestSources();

  for (const control of compoundControls) {
    const requiredParts = getRequiredToolcraftControlPartCoverage(control);
    const entry = appAcceptance.find(
      (acceptanceEntry) =>
        acceptanceEntry.kind === "control" && acceptanceEntry.target === control.target,
    );

    expect(
      entry,
      `${control.target} must have acceptance coverage before its compound browser test can be checked.`,
    ).toBeDefined();

    if (!entry) {
      continue;
    }

    expect(
      entry.controlPartCoverage === "all-visible-parts" ||
        requiredParts.every((part) => entry.controlPartCoverage?.includes(part)),
      `${control.target} acceptance must declare controlPartCoverage for ${requiredParts.join(", ")}.`,
    ).toBe(true);

    const browserTestSource = findNamedBrowserTestSource(
      browserTestSources,
      entry.browserTestName,
    );

    expect(
      browserTestSource,
      `${control.target} must be backed by browser test "${entry.browserTestName}".`,
    ).toBeDefined();

    if (!browserTestSource) {
      continue;
    }

    for (const part of requiredParts) {
      expect(
        browserTestSource,
        `${control.target} browser test must explicitly exercise value part "${part}".`,
      ).toContain(part);
    }
  }
});

test("segmented layout helper catches paddingless or colliding cells", async ({ page }) => {
  await page.setContent(`
    <div data-slot="field">FX Preset
      <div data-slot="toggle-group" style="display:flex;width:360px;">
        <button data-slot="toggle-group-item" style="box-sizing:border-box;width:120px;padding:0 12px;">One</button>
        <button data-slot="toggle-group-item" style="box-sizing:border-box;width:120px;padding:0 12px;">Two</button>
        <button data-slot="toggle-group-item" style="box-sizing:border-box;width:120px;padding:0 12px;">Off</button>
      </div>
    </div>
  `);

  await expectToolcraftSegmentedControlCellsPreservePadding(page, "FX Preset");

  await page.setContent(`
    <div data-slot="field">FX Preset
      <div data-slot="toggle-group" style="display:flex;width:180px;">
        <button data-slot="toggle-group-item" style="box-sizing:border-box;width:60px;padding:0;">Full Stack</button>
        <button data-slot="toggle-group-item" style="box-sizing:border-box;width:60px;padding:0;">RGB Split</button>
        <button data-slot="toggle-group-item" style="box-sizing:border-box;width:60px;padding:0;">Lines</button>
      </div>
    </div>
  `);

  await expect(
    expectToolcraftSegmentedControlCellsPreservePadding(page, "FX Preset"),
  ).rejects.toThrow(/must preserve cell padding/);
});

test("browser timeline coverage verifies the concrete timeline mode behavior", () => {
  const browserTestSources = readSiblingBrowserTestSources();

  for (const entry of getTimelineCoverageEntries("playback")) {
    const browserTestSource = findNamedBrowserTestSource(
      browserTestSources,
      entry.browserTestName,
    );

    expect(
      browserTestSource,
      `${entry.id} must be backed by browser test "${entry.browserTestName}".`,
    ).toBeDefined();

    if (!browserTestSource) {
      continue;
    }

    expect(browserTestSource, `${entry.id} must test pause/play transport.`).toMatch(
      /Pause playback[\s\S]*Play playback|Play playback[\s\S]*Pause playback/,
    );
    expect(browserTestSource, `${entry.id} must test loop transport state.`).toMatch(
      /Disable loop[\s\S]*Enable loop|Enable loop[\s\S]*Disable loop/,
    );
  }

  for (const entry of getTimelineCoverageEntries("keyframes")) {
    const browserTestSource = findNamedBrowserTestSource(
      browserTestSources,
      entry.browserTestName,
    );

    expect(
      browserTestSource,
      `${entry.id} must be backed by browser test "${entry.browserTestName}".`,
    ).toBeDefined();

    if (!browserTestSource) {
      continue;
    }

    expect(browserTestSource, `${entry.id} must open the expanded keyframe editor.`).toMatch(
      /Expand timeline panel|timeline\.setExpanded|timeline-expanded/,
    );
    expect(browserTestSource, `${entry.id} must create or update keyframe rows.`).toMatch(
      /Add .* keyframe|Disable .* keyframes|timeline-keyframe-row/,
    );
    expect(
      hasProductObservableHelper(browserTestSource),
      `${entry.id} must prove rendered keyframe output through the shared product observable helper.`,
    ).toBe(true);
  }
});

test("browser layer coverage verifies concrete layer behavior", () => {
  const layerEntries = getLayerCoverageEntries();
  if (layerEntries.length === 0) {
    return;
  }

  const browserTestSources = readSiblingBrowserTestSources();

  for (const entry of layerEntries) {
    const browserTestSource = findNamedBrowserTestSource(
      browserTestSources,
      entry.browserTestName,
    );

    expect(
      browserTestSource,
      `${entry.id} must be backed by browser test "${entry.browserTestName}".`,
    ).toBeDefined();

    if (!browserTestSource) {
      continue;
    }

    switch (entry.layerCoverage) {
      case "selection":
        expect(
          hasRealLayerRowInteraction(browserTestSource),
          `${entry.id} must select a real LayersPanel row, not dispatch layers.select directly.`,
        ).toBe(true);
        break;
      case "visibility":
        expect(
          hasRealLayerRowInteraction(browserTestSource),
          `${entry.id} must locate the real layer row before toggling visibility.`,
        ).toBe(true);
        expect(
          hasRealLayerVisibilityInteraction(browserTestSource),
          `${entry.id} must toggle a real layer visibility button.`,
        ).toBe(true);
        break;
      case "reorder":
        expect(
          hasRealLayerRowInteraction(browserTestSource),
          `${entry.id} must locate real layer rows before reorder.`,
        ).toBe(true);
        expect(
          hasRealLayerDragInteraction(browserTestSource),
          `${entry.id} must drag real layer rows instead of dispatching layers.reorder.`,
        ).toBe(true);
        break;
      case "grouping":
        expect(
          hasRealLayerRowInteraction(browserTestSource),
          `${entry.id} must locate real layer rows before grouping.`,
        ).toBe(true);
        expect(
          hasRealLayerDragInteraction(browserTestSource),
          `${entry.id} must drag a real layer row into a group.`,
        ).toBe(true);
        expect(
          hasLayerGroupTarget(browserTestSource),
          `${entry.id} must use a real group row as the drop target.`,
        ).toBe(true);
        break;
      case "selected-layer-controls":
        expect(
          hasRealLayerRowInteraction(browserTestSource),
          `${entry.id} must prove controls edit the selected layer output.`,
        ).toBe(true);
        expect(
          hasProductObservableHelper(browserTestSource),
          `${entry.id} must assert a product output or rendered-pixel change.`,
        ).toBe(true);
        break;
      case "media-lifecycle":
        expect(browserTestSource, `${entry.id} must test layer media lifecycle.`).toMatch(
          /media\.import|media\.delete|upload|delete|remove/i,
        );
        break;
    }
  }
});

test("browser reference-runtime-clone coverage proves reference parity behavior", () => {
  if (appTransferMode.mode !== "reference-runtime-clone") {
    return;
  }

  const browserTestSources = readSiblingBrowserTestSources();

  for (const coverage of appTransferMode.behaviorCoverage) {
    const entry = getReferenceCoverageEntry(coverage);

    expect(
      entry,
      `reference-runtime-clone behavior "${coverage}" must have an acceptance entry.`,
    ).toBeDefined();

    if (!entry) {
      continue;
    }

    const browserTestSource = findNamedBrowserTestSource(
      browserTestSources,
      entry.browserTestName,
    );

    expect(
      browserTestSource,
      `${entry.id} must be backed by browser test "${entry.browserTestName}".`,
    ).toBeDefined();

    if (!browserTestSource) {
      continue;
    }

    expect(
      browserTestSource,
      `${entry.id} must compare against reference runtime behavior, not only assert that Toolcraft state changed.`,
    ).toMatch(/reference|baseline|parity|sourceOfTruth|legacy|cadence|lifetime|spawn/i);
  }
});
