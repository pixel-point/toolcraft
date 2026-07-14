import { expect, type Locator, type Page } from "@playwright/test";

export function getCanvasHandle(page: Page, testId: string): Locator {
  return page.locator(`[data-toolcraft-canvas-handle][data-testid="${testId}"]`);
}

export async function dragCanvasHandle(
  page: Page,
  testId: string,
  delta: { x: number; y: number },
): Promise<void> {
  const handle = getCanvasHandle(page, testId);
  await expect(handle, `Canvas handle "${testId}" should be visible`).toBeVisible();

  const box = await handle.boundingBox();
  if (!box) {
    throw new Error(`Could not measure canvas handle "${testId}".`);
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + delta.x, startY + delta.y, { steps: 8 });
  await page.mouse.up();
}

const defaultForbiddenCanvasCopyPatterns = [
  /apply/i,
  /choose file/i,
  /click to upload/i,
  /copy png/i,
  /drag it onto the canvas/i,
  /export png/i,
  /generate/i,
  /reset/i,
  /settings/i,
  /upload an image/i,
] as const;

const productCanvasTextSelector =
  "[data-toolcraft-product-output], [data-toolcraft-product-text]";

export type ToolcraftCanvasUiCheckOptions = {
  allowedProductText?: readonly RegExp[];
};

export async function expectNoForbiddenCanvasUi(
  page: Page,
  options: ToolcraftCanvasUiCheckOptions = {},
): Promise<void> {
  const canvasWorld = page.locator(
    '[data-toolcraft-canvas-world], [data-toolcraft-editable-canvas]',
  );

  await expect(
    canvasWorld.locator(
      [
        'button:not([data-toolcraft-canvas-handle])',
        "input",
        "textarea",
        "select",
        '[role="button"]:not([data-toolcraft-canvas-handle])',
        '[role="menu"]',
        '[role="dialog"]',
        '[data-slot="button"]',
        '[data-slot="input"]',
      ].join(", "),
    ),
    "Canvas must not contain app UI controls; only product output and data-toolcraft-canvas-handle overlays are allowed.",
  ).toHaveCount(0);

  const canvasTextMatches = await canvasWorld.evaluateAll(
    (roots, { allowedSources, forbiddenSources, productTextSelector }) => {
      const allowedPatterns = allowedSources.map((source) => new RegExp(source, "i"));
      const forbiddenPatterns = forbiddenSources.map((source) => new RegExp(source, "i"));
      const matches: { kind: "forbidden-copy" | "unclassified-text"; text: string }[] = [];

      const getDirectText = (element: Element) =>
        Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent?.trim() ?? "")
          .filter(Boolean)
          .join(" ")
          .trim();

      for (const root of roots) {
        const elements = [root, ...Array.from(root.querySelectorAll("*"))];

        for (const element of elements) {
          if (element.closest("[data-toolcraft-canvas-handle]")) {
            continue;
          }

          const text = getDirectText(element);

          if (!text) {
            continue;
          }

          if (allowedPatterns.some((pattern) => pattern.test(text))) {
            continue;
          }

          if (forbiddenPatterns.some((pattern) => pattern.test(text))) {
            matches.push({ kind: "forbidden-copy", text });
            continue;
          }

          if (!element.closest(productTextSelector)) {
            matches.push({ kind: "unclassified-text", text });
          }
        }
      }

      return matches;
    },
    {
      allowedSources: (options.allowedProductText ?? []).map((pattern) => pattern.source),
      forbiddenSources: defaultForbiddenCanvasCopyPatterns.map((pattern) => pattern.source),
      productTextSelector: productCanvasTextSelector,
    },
  );

  expect(
    canvasTextMatches,
    "Canvas text must be product output marked with data-toolcraft-product-output/data-toolcraft-product-text; app UI copy, CTAs, helper text, upload prompts, export/copy/reset text, and settings labels are forbidden.",
  ).toEqual([]);
}

export async function expectExportExcludesCanvasHandles(
  page: Page,
  exportAction: () => Promise<unknown>,
): Promise<void> {
  await exportAction();

  const handles = page.locator("[data-toolcraft-canvas-handle]");
  const count = await handles.count();

  for (let index = 0; index < count; index += 1) {
    const handle = handles.nth(index);
    await expect(
      handle,
      "Canvas handles should remain editor overlays after export/copy and must not be duplicated into product output.",
    ).toHaveAttribute("data-toolcraft-canvas-handle");
  }
}

export async function expectCanvasHandlesUseToolcraftVisualLanguage(page: Page): Promise<void> {
  const handles = page.locator("[data-toolcraft-canvas-handle]");
  const count = await handles.count();

  for (let index = 0; index < count; index += 1) {
    const handle = handles.nth(index);

    await expect(handle, `Canvas handle ${index + 1} should be visible`).toBeVisible();
    await expect(
      handle.locator(
        [
          "button",
          "input",
          "textarea",
          "select",
          '[role="button"]',
          '[role="menu"]',
          '[role="dialog"]',
          '[data-slot="button"]',
          '[data-slot="input"]',
        ].join(", "),
      ),
      "Canvas handles must not contain nested app UI controls.",
    ).toHaveCount(0);

    const style = await handle.evaluate((node) => {
      const element = node as HTMLElement;
      const elements = [element, ...Array.from(element.querySelectorAll<HTMLElement>("*"))];
      const toNumber = (value: string) => Number.parseFloat(value) || 0;
      const svgStrokeWidths = Array.from(
        element.querySelectorAll<SVGElement>(
          "svg [stroke-width], svg line, svg path, svg circle, svg rect, svg polyline, svg polygon",
        ),
      ).map((svgElement) => {
        const attributeValue = svgElement.getAttribute("stroke-width");
        const computedValue = window.getComputedStyle(svgElement).strokeWidth;
        return toNumber(attributeValue ?? computedValue);
      });
      const getMaxStrokeWidth = (property: "border" | "outline") =>
        Math.max(
          ...elements.map((currentElement) => {
            const computed = window.getComputedStyle(currentElement);
            if (property === "outline") {
              return toNumber(computed.outlineWidth);
            }

            return Math.max(
              toNumber(computed.borderTopWidth),
              toNumber(computed.borderRightWidth),
              toNumber(computed.borderBottomWidth),
              toNumber(computed.borderLeftWidth),
            );
          }),
        );
      const rect = element.getBoundingClientRect();

      return {
        borderWidth: getMaxStrokeWidth("border"),
        height: rect.height,
        outlineWidth: getMaxStrokeWidth("outline"),
        role: element.getAttribute("role") ?? "",
        svgStrokeWidth: Math.max(0, ...svgStrokeWidths),
        tagName: element.tagName.toLowerCase(),
        text: element.textContent?.trim() ?? "",
        width: rect.width,
      };
    });

    expect(
      ["button", "input", "select", "textarea"],
      "Canvas handle roots must be visual elements, not native app controls.",
    ).not.toContain(style.tagName);
    expect(
      ["button", "menu", "dialog", "textbox", "slider", "spinbutton", "combobox", "listbox"],
      "Canvas handle roots must not expose app-control roles.",
    ).not.toContain(style.role);
    expect(style.text, "Canvas handles should be visual pins/lines, not text labels.").toBe("");
    expect(
      style.borderWidth,
      "Canvas handle borders, including child elements, should stay close to Toolcraft control stroke weights.",
    ).toBeLessThanOrEqual(2);
    expect(
      style.outlineWidth,
      "Canvas handle outlines, including child elements, should stay close to Toolcraft focus ring weights.",
    ).toBeLessThanOrEqual(2);
    expect(
      style.svgStrokeWidth,
      "Canvas handle SVG strokes should stay close to Toolcraft control stroke weights.",
    ).toBeLessThanOrEqual(2);
    expect(
      style.width <= 96 || style.height <= 96,
      "Canvas handles should be pins, lines, corners, or light geometry, not panel-sized controls.",
    ).toBe(true);
  }
}
