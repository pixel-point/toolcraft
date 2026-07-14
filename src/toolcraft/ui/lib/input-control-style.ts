export type SharedInputControlSize = "sm" | "default" | "lg" | "xl";

export const SHARED_INPUT_CONTROL_SURFACE_CLASS_NAME =
  "border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_5%,transparent)] bg-clip-padding text-[color:var(--foreground)]";

export const SHARED_INPUT_CONTROL_BASE_CLASS_NAME = [
  "w-full min-w-0 cursor-text rounded-lg border transition-colors outline-none",
  "file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-[color:var(--foreground)]",
  "placeholder:text-[color:var(--muted-foreground)]",
  "[&:not(:focus):hover]:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] [&:not(:focus):hover]:text-[color:var(--foreground)]",
  "focus:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]",
  "focus-visible:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-[color:var(--destructive)]",
  "dark:aria-invalid:border-[color:color-mix(in_oklab,var(--destructive)_50%,transparent)]",
  SHARED_INPUT_CONTROL_SURFACE_CLASS_NAME,
].join(" ");

export const SHARED_INPUT_CONTROL_SIZE_CLASS_NAMES = {
  default: "h-7 px-2 py-0.5 text-xs/relaxed file:h-6 file:text-xs/relaxed",
  lg: "h-8 px-2.5 py-1 text-sm/relaxed file:h-7 file:text-sm/relaxed",
  sm: "h-6 px-2 py-0 text-xs/relaxed file:h-5 file:text-xs/relaxed",
  xl: "h-10 px-3 py-1.5 text-base/relaxed file:h-9 file:text-base/relaxed",
} as const satisfies Record<SharedInputControlSize, string>;

type SharedInputControlCssSizeValue = {
  fontSize: string;
  height: string;
  lineHeight: string;
  padding: string;
};

const SHARED_INPUT_CONTROL_SIZE_CSS_VALUES = {
  default: {
    fontSize: "0.75rem",
    height: "1.75rem",
    lineHeight: "1.625",
    padding: "0.125rem 0.5rem",
  },
  lg: {
    fontSize: "0.875rem",
    height: "2rem",
    lineHeight: "1.625",
    padding: "0.25rem 0.625rem",
  },
  sm: {
    fontSize: "0.75rem",
    height: "1.5rem",
    lineHeight: "1.625",
    padding: "0 0.5rem",
  },
  xl: {
    fontSize: "1rem",
    height: "2.5rem",
    lineHeight: "1.625",
    padding: "0.375rem 0.75rem",
  },
} as const satisfies Record<
  SharedInputControlSize,
  SharedInputControlCssSizeValue
>;

export function buildSharedInputControlCss({
  extraDeclarations = [],
  selector,
  size = "default",
}: {
  extraDeclarations?: readonly string[];
  selector: string;
  size?: SharedInputControlSize;
}): string {
  const sizeValues = SHARED_INPUT_CONTROL_SIZE_CSS_VALUES[size];
  const extraDeclarationCss =
    extraDeclarations.length > 0
      ? `${extraDeclarations.map((declaration) => `  ${declaration}`).join("\n")}\n`
      : "";

  return `
${selector} {
  width: 100%;
  min-width: 0;
  height: ${sizeValues.height};
  box-sizing: border-box;
  border: 1px solid color-mix(in oklab, var(--border) 12%, transparent);
  border-radius: var(--radius-lg, 0.5rem);
  background: color-mix(in oklab, var(--input) 5%, transparent);
  background-clip: padding-box;
  color: var(--foreground);
  padding: ${sizeValues.padding};
  font-family: inherit;
  font-size: ${sizeValues.fontSize};
  line-height: ${sizeValues.lineHeight};
  outline: none;
  cursor: text;
  transition-property:
    color,
    background-color,
    border-color,
    outline-color,
    text-decoration-color,
    fill,
    stroke,
    --tw-gradient-from,
    --tw-gradient-via,
    --tw-gradient-to;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
${extraDeclarationCss}}
${selector}::placeholder {
  color: var(--muted-foreground);
  opacity: 1;
}
${selector}:not(:disabled):not(:focus):hover {
  border-color: color-mix(in oklab, var(--border) 20%, transparent);
  color: var(--foreground);
}
${selector}:not(:disabled):focus {
  border-color: color-mix(in oklab, var(--border) 30%, transparent);
}
[data-focus-visible-mode="keyboard"] ${selector}:focus-visible {
  border-color: color-mix(in oklab, var(--border) 30%, transparent);
}
${selector}:disabled {
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.5;
}
${selector}[aria-invalid="true"] {
  border-color: var(--destructive);
}`;
}
