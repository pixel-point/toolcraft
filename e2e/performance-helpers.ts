import { expect, type Locator, type Page } from "@playwright/test";

import type {
  ToolcraftPerformanceBudget,
  ToolcraftPerformanceConfig,
} from "@/toolcraft/runtime";

export type ToolcraftFrameProbeResult = {
  longTaskCount: number;
  longTaskMaxMs: number;
  maxFrameGapMs: number;
  sampleCount: number;
};

export type ToolcraftInteractionResult = ToolcraftFrameProbeResult & {
  durationMs: number;
};

export type ToolcraftInteractionOptions = {
  settleFrames?: number;
  settleMs?: number;
};

export type ToolcraftStressFixtureApplyContext = {
  config: ToolcraftPerformanceConfig;
  fixture: Record<string, unknown>;
  key: string;
  page: Page;
  scenarioId: string;
};

export type ToolcraftStressFixtureAppliers = Record<
  string,
  (
    value: unknown,
    context: ToolcraftStressFixtureApplyContext,
  ) => Promise<void> | void
>;

function isToolcraftStressFixtureObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function startToolcraftFrameProbe(
  page: Page,
): Promise<() => Promise<ToolcraftFrameProbeResult>> {
  await page.evaluate(() => {
    const win = window as Window & {
      __toolcraftFrameProbe?: {
        active: boolean;
        longTaskCount: number;
        longTaskMaxMs: number;
        observer?: PerformanceObserver;
        maxFrameGapMs: number;
        rafId: number;
        sampleCount: number;
      };
      __toolcraftStopFrameProbe?: () => ToolcraftFrameProbeResult;
    };

    if (win.__toolcraftFrameProbe?.active) {
      cancelAnimationFrame(win.__toolcraftFrameProbe.rafId);
    }

    let lastFrame = performance.now();
    win.__toolcraftFrameProbe = {
      active: true,
      longTaskCount: 0,
      longTaskMaxMs: 0,
      maxFrameGapMs: 0,
      rafId: 0,
      sampleCount: 0,
    };

    try {
      win.__toolcraftFrameProbe.observer = new PerformanceObserver((list) => {
        const probe = win.__toolcraftFrameProbe;
        if (!probe?.active) {
          return;
        }

        for (const entry of list.getEntries()) {
          probe.longTaskCount += 1;
          probe.longTaskMaxMs = Math.max(probe.longTaskMaxMs, entry.duration);
        }
      });
      win.__toolcraftFrameProbe.observer.observe({ entryTypes: ["longtask"] });
    } catch {
      // Some browser contexts do not expose longtask entries. Frame gaps still catch jank.
    }

    const tick = (now: number) => {
      const probe = win.__toolcraftFrameProbe;
      if (!probe?.active) {
        return;
      }

      probe.maxFrameGapMs = Math.max(probe.maxFrameGapMs, now - lastFrame);
      probe.sampleCount += 1;
      lastFrame = now;
      probe.rafId = requestAnimationFrame(tick);
    };

    win.__toolcraftFrameProbe.rafId = requestAnimationFrame(tick);
    win.__toolcraftStopFrameProbe = () => {
      const probe = win.__toolcraftFrameProbe ?? {
        active: false,
        longTaskCount: 0,
        longTaskMaxMs: 0,
        maxFrameGapMs: 0,
        rafId: 0,
        sampleCount: 0,
      };

      probe.active = false;
      cancelAnimationFrame(probe.rafId);
      probe.observer?.disconnect();

      return {
        longTaskCount: probe.longTaskCount,
        longTaskMaxMs: probe.longTaskMaxMs,
        maxFrameGapMs: probe.maxFrameGapMs,
        sampleCount: probe.sampleCount,
      };
    };
  });

  return async () =>
    page.evaluate(() => {
      const win = window as Window & {
        __toolcraftStopFrameProbe?: () => ToolcraftFrameProbeResult;
      };

      return (
        win.__toolcraftStopFrameProbe?.() ?? {
          longTaskCount: 0,
          longTaskMaxMs: 0,
          maxFrameGapMs: 0,
          sampleCount: 0,
        }
      );
    });
}

export async function measureToolcraftInteraction(
  page: Page,
  action: () => Promise<void>,
  options: ToolcraftInteractionOptions = {},
): Promise<ToolcraftInteractionResult> {
  const stopProbe = await startToolcraftFrameProbe(page);
  const startedAt = await page.evaluate(() => performance.now());

  await action();

  const endedAt = await page.evaluate(() => performance.now());
  await waitForToolcraftAnimationFrames(page, options.settleFrames ?? 3);

  if (options.settleMs && options.settleMs > 0) {
    await page.waitForTimeout(options.settleMs);
  }

  const frameProbe = await stopProbe();

  return {
    durationMs: endedAt - startedAt,
    longTaskCount: frameProbe.longTaskCount,
    longTaskMaxMs: frameProbe.longTaskMaxMs,
    maxFrameGapMs: frameProbe.maxFrameGapMs,
    sampleCount: frameProbe.sampleCount,
  };
}

export async function measureToolcraftAnimationFrames(
  page: Page,
  frameCount = 120,
  options: ToolcraftInteractionOptions = {},
): Promise<ToolcraftInteractionResult> {
  if (frameCount < 120) {
    throw new Error("Animation performance probes must sample at least 120 frames.");
  }

  const stopProbe = await startToolcraftFrameProbe(page);
  const startedAt = await page.evaluate(() => performance.now());

  await waitForToolcraftAnimationFrames(page, frameCount);

  if (options.settleFrames && options.settleFrames > 0) {
    await waitForToolcraftAnimationFrames(page, options.settleFrames);
  }

  if (options.settleMs && options.settleMs > 0) {
    await page.waitForTimeout(options.settleMs);
  }

  const endedAt = await page.evaluate(() => performance.now());
  const frameProbe = await stopProbe();

  return {
    durationMs: endedAt - startedAt,
    longTaskCount: frameProbe.longTaskCount,
    longTaskMaxMs: frameProbe.longTaskMaxMs,
    maxFrameGapMs: frameProbe.maxFrameGapMs,
    sampleCount: frameProbe.sampleCount,
  };
}

export async function waitForToolcraftAnimationFrames(page: Page, count: number): Promise<void> {
  if (count <= 0) {
    return;
  }

  await page.evaluate(
    (frameCount) =>
      new Promise<void>((resolve) => {
        let remainingFrames = frameCount;

        const tick = () => {
          remainingFrames -= 1;

          if (remainingFrames <= 0) {
            resolve();
            return;
          }

          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      }),
    count,
  );
}

export async function getToolcraftFieldByLabel(page: Page, label: string): Promise<Locator> {
  const field = page.locator('[data-slot="field"]').filter({ hasText: new RegExp(`^${label}`) });
  await expect(field, `Toolcraft field "${label}" should be visible`).toBeVisible();
  return field;
}

export async function expectToolcraftSegmentedControlCellsPreservePadding(
  page: Page,
  label: string,
  options: {
    minHorizontalPaddingPx?: number;
  } = {},
): Promise<void> {
  const minHorizontalPaddingPx = options.minHorizontalPaddingPx ?? 6;
  const field = await getToolcraftFieldByLabel(page, label);
  const segmentedGroup = field.locator('[data-slot="toggle-group"]').first();

  await expect(
    segmentedGroup,
    `Toolcraft segmented control "${label}" should render a toggle group.`,
  ).toBeVisible();

  const issues = await segmentedGroup.evaluate(
    (group, minPadding) => {
      type LayoutIssue = {
        label: string;
        reason: string;
      };

      function getTextRect(element: Element): DOMRect | null {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            return node.textContent?.trim()
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          },
        });
        const textNodes: Text[] = [];
        let currentNode = walker.nextNode();

        while (currentNode) {
          textNodes.push(currentNode as Text);
          currentNode = walker.nextNode();
        }

        if (textNodes.length === 0) {
          return null;
        }

        const range = document.createRange();
        range.setStartBefore(textNodes[0]!);
        range.setEndAfter(textNodes[textNodes.length - 1]!);

        return range.getBoundingClientRect();
      }

      const items = Array.from(
        group.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]'),
      );
      const issues: LayoutIssue[] = [];
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index]!;
        const itemRect = item.getBoundingClientRect();
        const textRect = getTextRect(item);
        const label = item.textContent?.trim() || item.getAttribute("aria-label") || `#${index + 1}`;
        const nextItem = items[index + 1];
        const computedStyle = window.getComputedStyle(item);

        if (context && label.trim()) {
          context.font = computedStyle.font;
          const measuredTextWidth = context.measureText(label).width;
          const requiredWidth = measuredTextWidth + minPadding * 2;

          if (requiredWidth > itemRect.width + 0.5) {
            issues.push({
              label,
              reason: `label requires ${requiredWidth.toFixed(2)}px including padding but cell width is ${itemRect.width.toFixed(2)}px`,
            });
          }
        }

        if (nextItem) {
          const nextRect = nextItem.getBoundingClientRect();

          if (itemRect.right > nextRect.left + 0.5) {
            issues.push({
              label,
              reason: `cell overlaps next cell by ${(itemRect.right - nextRect.left).toFixed(2)}px`,
            });
          }
        }

        if (item.scrollWidth > item.clientWidth + 1) {
          issues.push({
            label,
            reason: `cell scrollWidth ${item.scrollWidth}px exceeds clientWidth ${item.clientWidth}px`,
          });
        }

        if (!textRect) {
          continue;
        }

        const leftPadding = textRect.left - itemRect.left;
        const rightPadding = itemRect.right - textRect.right;

        if (leftPadding < minPadding) {
          issues.push({
            label,
            reason: `left text padding ${leftPadding.toFixed(2)}px is below ${minPadding}px`,
          });
        }

        if (rightPadding < minPadding) {
          issues.push({
            label,
            reason: `right text padding ${rightPadding.toFixed(2)}px is below ${minPadding}px`,
          });
        }
      }

      return issues;
    },
    minHorizontalPaddingPx,
  );

  expect(
    issues,
    `Toolcraft segmented control "${label}" must preserve cell padding and avoid label collisions.`,
  ).toEqual([]);
}

export async function dragToolcraftSliderByLabel(
  page: Page,
  label: string,
  targetRatio: number,
): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  const slider = field.locator('[data-slot="slider"], [role="slider"]').first();

  await expect(slider, `Toolcraft slider "${label}" should be visible`).toBeVisible();

  const box = await slider.boundingBox();
  if (!box) {
    throw new Error(`Could not measure slider "${label}".`);
  }

  const startX = box.x + box.width * 0.15;
  const endX = box.x + box.width * targetRatio;
  const y = box.y + box.height / 2;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 12 });
  await page.mouse.up();
}

export async function dragToolcraftSliderToValue(
  page: Page,
  label: string,
  value: number,
): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  const slider = field.locator('[data-slot="slider"], [role="slider"]').first();

  await expect(slider, `Toolcraft slider "${label}" should be visible`).toBeVisible();

  const range = await slider.evaluate((element) => {
    const htmlElement = element as HTMLElement;
    const min = Number(
      htmlElement.getAttribute("aria-valuemin") ??
        (htmlElement as HTMLInputElement).min ??
        "0",
    );
    const max = Number(
      htmlElement.getAttribute("aria-valuemax") ??
        (htmlElement as HTMLInputElement).max ??
        "100",
    );

    return {
      max: Number.isFinite(max) ? max : 100,
      min: Number.isFinite(min) ? min : 0,
    };
  });
  const denominator = range.max - range.min;
  const ratio = denominator === 0 ? 0 : (value - range.min) / denominator;

  await dragToolcraftSliderByLabel(page, label, Math.min(1, Math.max(0, ratio)));
}

export async function dragToolcraftSliderToPerformanceStressValue(
  page: Page,
  label: string,
  config: ToolcraftPerformanceConfig,
  scenarioId: string,
): Promise<void> {
  const value = getToolcraftPerformanceStressValue(config, scenarioId);

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" must provide a numeric stressFixture.value for slider "${label}".`,
    );
  }

  await dragToolcraftSliderToValue(page, label, value);
}

export async function expectToolcraftCanvasBackingPixelsForRenderScale(
  page: Page,
  canvasSelector: string,
  renderScale: number,
): Promise<void> {
  if (!Number.isFinite(renderScale) || renderScale <= 1) {
    throw new Error(
      `Toolcraft render scale backing-pixel checks require a numeric renderScale greater than 1, received ${renderScale}.`,
    );
  }

  const canvas = page.locator(canvasSelector).first();
  await expect(
    canvas,
    `Toolcraft render scale check expected a visible canvas matching "${canvasSelector}".`,
  ).toBeVisible();

  const metrics = await canvas.evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error("Render scale backing-pixel checks must target an HTMLCanvasElement.");
    }

    const rect = element.getBoundingClientRect();
    return {
      backingHeight: element.height,
      backingWidth: element.width,
      cssHeight: element.clientHeight || rect.height,
      cssWidth: element.clientWidth || rect.width,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  });

  const expectedWidth = metrics.cssWidth * metrics.devicePixelRatio * renderScale;
  const expectedHeight = metrics.cssHeight * metrics.devicePixelRatio * renderScale;

  expect(
    metrics.backingWidth,
    `Expected canvas backing width to honor Resolution scale ${renderScale}.`,
  ).toBeGreaterThanOrEqual(Math.floor(expectedWidth - 1));
  expect(
    metrics.backingHeight,
    `Expected canvas backing height to honor Resolution scale ${renderScale}.`,
  ).toBeGreaterThanOrEqual(Math.floor(expectedHeight - 1));
}

export async function applyToolcraftPerformanceStressFixture(
  page: Page,
  config: ToolcraftPerformanceConfig,
  scenarioId: string,
  appliers: ToolcraftStressFixtureAppliers,
): Promise<Record<string, unknown>> {
  const fixture = getToolcraftPerformanceStressValue(config, scenarioId);

  if (!isToolcraftStressFixtureObject(fixture)) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" must provide an object stressFixture.value for combined fixture application.`,
    );
  }

  const fixtureKeys = Object.keys(fixture);
  if (fixtureKeys.length === 0) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" stressFixture.value must contain at least one key.`,
    );
  }

  const missingKeys = fixtureKeys.filter((key) => !appliers[key]);
  if (missingKeys.length > 0) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" is missing fixture appliers for: ${missingKeys.join(
        ", ",
      )}.`,
    );
  }

  const extraKeys = Object.keys(appliers).filter((key) => !fixtureKeys.includes(key));
  if (extraKeys.length > 0) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" declares fixture appliers not present in stressFixture.value: ${extraKeys.join(
        ", ",
      )}.`,
    );
  }

  for (const key of fixtureKeys) {
    await appliers[key]!(fixture[key], {
      config,
      fixture,
      key,
      page,
      scenarioId,
    });
  }

  return fixture;
}

export async function applyToolcraftPerformanceWorkloadFixture(
  page: Page,
  config: ToolcraftPerformanceConfig,
  scenarioId: string,
  appliers: ToolcraftStressFixtureAppliers,
): Promise<Record<string, unknown>> {
  const fixture = getToolcraftPerformanceWorkloadValue(config, scenarioId);

  if (!isToolcraftStressFixtureObject(fixture)) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" must provide an object workloadFixture.value for baseline fixture application.`,
    );
  }

  const fixtureKeys = Object.keys(fixture);
  if (fixtureKeys.length === 0) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" workloadFixture.value must contain at least one key.`,
    );
  }

  const missingKeys = fixtureKeys.filter((key) => !appliers[key]);
  if (missingKeys.length > 0) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" is missing workload fixture appliers for: ${missingKeys.join(
        ", ",
      )}.`,
    );
  }

  const extraKeys = Object.keys(appliers).filter((key) => !fixtureKeys.includes(key));
  if (extraKeys.length > 0) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" declares workload fixture appliers not present in workloadFixture.value: ${extraKeys.join(
        ", ",
      )}.`,
    );
  }

  for (const key of fixtureKeys) {
    await appliers[key]!(fixture[key], {
      config,
      fixture,
      key,
      page,
      scenarioId,
    });
  }

  return fixture;
}

export async function dragToolcraftCanvasViewport(
  page: Page,
  delta: { x: number; y: number } = { x: 96, y: -64 },
): Promise<void> {
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  await expect(viewport, "Toolcraft canvas viewport should be visible").toBeVisible();

  const box = await viewport.boundingBox();
  if (!box) {
    throw new Error("Could not measure Toolcraft canvas viewport.");
  }

  const startX = box.x + box.width * 0.5;
  const startY = box.y + box.height * 0.5;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + delta.x, startY + delta.y, { steps: 16 });
  await page.mouse.up();
}

export async function zoomToolcraftCanvasViewport(
  page: Page,
  repetitions = 2,
): Promise<void> {
  const zoomIn = page.getByRole("button", { name: "Zoom in" });
  const zoomOut = page.getByRole("button", { name: "Zoom out" });

  await expect(zoomIn, "Toolcraft zoom-in control should be visible").toBeVisible();
  await expect(zoomOut, "Toolcraft zoom-out control should be visible").toBeVisible();

  for (let index = 0; index < repetitions; index += 1) {
    await zoomIn.click();
    await waitForToolcraftAnimationFrames(page, 2);
  }

  for (let index = 0; index < repetitions; index += 1) {
    await zoomOut.click();
    await waitForToolcraftAnimationFrames(page, 2);
  }
}

export async function expectToolcraftDiscreteSliderDragSmoothness(
  page: Page,
  label: string,
  options: ToolcraftInteractionOptions & {
    expectMarkers?: boolean;
    maxFrameGapMs?: number;
    maxInteractionMs?: number;
  } = {},
): Promise<ToolcraftInteractionResult> {
  const field = await getToolcraftFieldByLabel(page, label);
  const slider = field.locator('[data-slot="slider"][data-variant="discrete"]').first();

  await expect(
    slider,
    `Toolcraft discrete slider "${label}" should render the discrete variant.`,
  ).toBeVisible();

  const markers = field.locator('[data-slot="slider-marker"]');
  if (options.expectMarkers === false) {
    await expect(
      markers,
      `Toolcraft half-width discrete slider "${label}" should hide over-budget tick markers.`,
    ).toHaveCount(0);
  } else {
    await expect(
      markers.first(),
      `Toolcraft discrete slider "${label}" should render tick markers.`,
    ).toBeVisible();
  }

  const result = await measureToolcraftInteraction(
    page,
    async () => {
      await dragToolcraftSliderByLabel(page, label, 0.85);
    },
    options,
  );

  expectToolcraftPerformanceBudget(result, {
    maxFrameGapMs: options.maxFrameGapMs ?? 80,
    maxInteractionMs: options.maxInteractionMs ?? 500,
  });

  return result;
}

export async function readToolcraftCanvasViewport(page: Page): Promise<{
  offsetX: number;
  offsetY: number;
  zoom: number;
}> {
  return page.evaluate(() => {
    const canvas = document.querySelector("[data-toolcraft-editable-canvas]");
    const style = canvas ? window.getComputedStyle(canvas) : null;
    const zoomText =
      canvas?.getAttribute("data-canvas-zoom") ??
      style?.getPropertyValue("--canvas-zoom") ??
      "1";

    return {
      offsetX: Number(canvas?.getAttribute("data-canvas-offset-x") ?? 0),
      offsetY: Number(canvas?.getAttribute("data-canvas-offset-y") ?? 0),
      zoom: Number.parseFloat(zoomText) || 1,
    };
  });
}

export async function expectToolcraftCanvasViewportStable(
  page: Page,
  action: () => Promise<void>,
  options: ToolcraftInteractionOptions & {
    maxOffsetDelta?: number;
    maxZoomDelta?: number;
  } = {},
): Promise<ToolcraftInteractionResult> {
  const before = await readToolcraftCanvasViewport(page);
  const result = await measureToolcraftInteraction(page, action, options);
  const after = await readToolcraftCanvasViewport(page);
  const maxOffsetDelta = options.maxOffsetDelta ?? 0.5;
  const maxZoomDelta = options.maxZoomDelta ?? 0.001;

  expect(
    Math.abs(after.offsetX - before.offsetX),
    `Expected canvas offsetX to stay stable within ${maxOffsetDelta}px.`,
  ).toBeLessThanOrEqual(maxOffsetDelta);
  expect(
    Math.abs(after.offsetY - before.offsetY),
    `Expected canvas offsetY to stay stable within ${maxOffsetDelta}px.`,
  ).toBeLessThanOrEqual(maxOffsetDelta);
  expect(
    Math.abs(after.zoom - before.zoom),
    `Expected canvas zoom to stay stable within ${maxZoomDelta}.`,
  ).toBeLessThanOrEqual(maxZoomDelta);

  return result;
}

type ToolcraftPerformanceBudgetResult = Partial<ToolcraftInteractionResult> & {
  durationMs?: number;
  exportMs?: number;
  frameGapMs?: number;
  previewMs?: number;
  renderMs?: number;
};

export function getToolcraftPerformanceScenarioBudget(
  config: ToolcraftPerformanceConfig,
  scenarioId: string,
): ToolcraftPerformanceBudget {
  const scenario = config.scenarios.find((item) => item.id === scenarioId);

  if (!scenario) {
    throw new Error(`Toolcraft performance scenario "${scenarioId}" was not found.`);
  }

  return scenario.budget;
}

export function getToolcraftPerformanceStressValue<TValue = unknown>(
  config: ToolcraftPerformanceConfig,
  scenarioId: string,
): TValue {
  const scenario = config.scenarios.find((item) => item.id === scenarioId);

  if (!scenario) {
    throw new Error(`Toolcraft performance scenario "${scenarioId}" was not found.`);
  }

  if (
    !scenario.stressFixture ||
    !Object.prototype.hasOwnProperty.call(scenario.stressFixture, "value")
  ) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" does not declare stressFixture.value.`,
    );
  }

  return scenario.stressFixture.value as TValue;
}

export function getToolcraftPerformanceWorkloadValue<TValue = unknown>(
  config: ToolcraftPerformanceConfig,
  scenarioId: string,
): TValue {
  const scenario = config.scenarios.find((item) => item.id === scenarioId);

  if (!scenario) {
    throw new Error(`Toolcraft performance scenario "${scenarioId}" was not found.`);
  }

  if (
    !scenario.workloadFixture ||
    !Object.prototype.hasOwnProperty.call(scenario.workloadFixture, "value")
  ) {
    throw new Error(
      `Toolcraft performance scenario "${scenarioId}" does not declare workloadFixture.value.`,
    );
  }

  return scenario.workloadFixture.value as TValue;
}

export function expectToolcraftScenarioPerformanceBudget(
  result: ToolcraftPerformanceBudgetResult,
  config: ToolcraftPerformanceConfig,
  scenarioId: string,
): void {
  expectToolcraftPerformanceBudget(
    result,
    getToolcraftPerformanceScenarioBudget(config, scenarioId),
  );
}

export function expectToolcraftPerformanceBudget(
  result: ToolcraftPerformanceBudgetResult,
  budget: ToolcraftPerformanceBudget,
): void {
  if (typeof budget.maxInteractionMs === "number") {
    expect(
      result.durationMs,
      `Expected interaction duration to stay within ${budget.maxInteractionMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxInteractionMs);
  }

  if (typeof budget.maxFrameGapMs === "number") {
    expect(
      result.maxFrameGapMs ?? result.frameGapMs,
      `Expected frame gaps to stay within ${budget.maxFrameGapMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxFrameGapMs);
  }

  if (typeof budget.maxLongTaskMs === "number") {
    expect(
      result.longTaskMaxMs,
      `Expected long tasks to stay within ${budget.maxLongTaskMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxLongTaskMs);
  }

  if (typeof budget.maxExportMs === "number") {
    expect(
      result.exportMs ?? result.durationMs,
      `Expected export/copy duration to stay within ${budget.maxExportMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxExportMs);
  }

  if (typeof budget.maxPreviewMs === "number") {
    expect(
      result.previewMs ?? result.durationMs,
      `Expected preview duration to stay within ${budget.maxPreviewMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxPreviewMs);
  }

  if (typeof budget.maxRenderMs === "number") {
    expect(
      result.renderMs ?? result.durationMs,
      `Expected render duration to stay within ${budget.maxRenderMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxRenderMs);
  }
}
