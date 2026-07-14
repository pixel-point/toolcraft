import { expect, type Page } from "@playwright/test";

const defaultProductObservableSelector = [
  "[data-toolcraft-product-output]",
  "[data-toolcraft-product-text]",
  "[data-toolcraft-canvas-slot] canvas",
  "[data-toolcraft-canvas-slot] svg",
  "[data-toolcraft-canvas-world] canvas",
  "[data-toolcraft-canvas-world] svg",
].join(", ");

export type ToolcraftProductObservableSnapshotOptions = {
  selector?: string;
  timeoutMs?: number;
};

export type ToolcraftProductObservableChangeOptions =
  ToolcraftProductObservableSnapshotOptions & {
    message?: string;
  };

export async function getToolcraftProductObservableSnapshot(
  page: Page,
  options: ToolcraftProductObservableSnapshotOptions = {},
): Promise<string> {
  const selector = options.selector ?? defaultProductObservableSelector;
  const observable = page.locator(selector).first();

  await expect(
    observable,
    `Product observable "${selector}" must exist and be visible.`,
  ).toBeVisible({
    timeout: options.timeoutMs ?? 5000,
  });

  return observable.evaluate((element) => {
    const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();
    const hashString = (value: string) => {
      let hash = 2166136261;

      for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }

      return (hash >>> 0).toString(16);
    };
    const hashBytes = (value: Uint8ClampedArray) => {
      let hash = 2166136261;

      for (let index = 0; index < value.length; index += 1) {
        hash ^= value[index] ?? 0;
        hash = Math.imul(hash, 16777619);
      }

      return (hash >>> 0).toString(16);
    };
    const snapshotCanvas = (canvas: HTMLCanvasElement) => {
      const width = canvas.width;
      const height = canvas.height;
      const sampleWidth = Math.max(1, Math.min(96, width));
      const sampleHeight = Math.max(1, Math.min(96, height));

      try {
        const sample = document.createElement("canvas");
        sample.width = sampleWidth;
        sample.height = sampleHeight;
        const context = sample.getContext("2d", { willReadFrequently: true });

        if (!context) {
          return {
            hash: "unavailable-context",
            height,
            sampleHeight,
            sampleWidth,
            width,
          };
        }

        context.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
        const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;

        return {
          hash: hashBytes(pixels),
          height,
          sampleHeight,
          sampleWidth,
          width,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "unreadable-canvas",
          height,
          sampleHeight,
          sampleWidth,
          width,
        };
      }
    };
    const snapshotElement = (node: Element) => {
      const rect = node.getBoundingClientRect();
      const computed = window.getComputedStyle(node);
      const attributes = Array.from(node.attributes)
        .filter((attribute) =>
          /^(?:aria-|data-|role$|class$|style$|viewBox$|width$|height$)/.test(
            attribute.name,
          ),
        )
        .map((attribute) => [attribute.name, attribute.value] as const)
        .sort(([left], [right]) => left.localeCompare(right));
      const canvases =
        node instanceof HTMLCanvasElement
          ? [snapshotCanvas(node)]
          : Array.from(node.querySelectorAll("canvas")).map(snapshotCanvas);
      const svgs =
        node instanceof SVGElement
          ? [hashString(node.outerHTML)]
          : Array.from(node.querySelectorAll("svg")).map((svg) => hashString(svg.outerHTML));

      return {
        attributes,
        canvases,
        childElementCount: node.childElementCount,
        rect: {
          height: Math.round(rect.height * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
          x: Math.round(rect.x * 100) / 100,
          y: Math.round(rect.y * 100) / 100,
        },
        style: {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          letterSpacing: computed.letterSpacing,
          lineHeight: computed.lineHeight,
          opacity: computed.opacity,
          transform: computed.transform,
        },
        svgs,
        tagName: node.tagName.toLowerCase(),
        text: normalizeText(node.textContent ?? ""),
      };
    };

    return JSON.stringify(snapshotElement(element));
  });
}

export async function expectToolcraftProductObservableToChange(
  page: Page,
  action: () => Promise<void>,
  options: ToolcraftProductObservableChangeOptions = {},
): Promise<void> {
  const before = await getToolcraftProductObservableSnapshot(page, options);

  await action();

  await expect
    .poll(
      async () => getToolcraftProductObservableSnapshot(page, options),
      {
        message:
          options.message ??
          "Product output should change after the visible user interaction.",
        timeout: options.timeoutMs ?? 5000,
      },
    )
    .not.toBe(before);
}
