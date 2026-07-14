import { AnimatedLoader, type LoaderSize } from "../primitives";
import { cn } from "../../lib/utils";

const DEFAULT_SPINNER_LOADER_WIDTH = 16;
export const DEFAULT_SPINNER_LOADER_HEIGHT = 4;

type SpinnerProps = React.ComponentProps<"span"> & {
  height?: LoaderSize;
  insetX?: number;
  indicatorClassName?: string;
  width?: LoaderSize;
};

function Spinner({
  "aria-hidden": ariaHidden,
  className,
  height = DEFAULT_SPINNER_LOADER_HEIGHT,
  insetX,
  indicatorClassName,
  width = DEFAULT_SPINNER_LOADER_WIDTH,
  ...props
}: SpinnerProps) {
  return (
    <span
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : "Loading"}
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      data-slot="spinner"
      role={ariaHidden ? undefined : "status"}
      {...props}
    >
      <AnimatedLoader
        className="shrink-0"
        height={height}
        indicatorClassName={cn("bg-current opacity-100", indicatorClassName)}
        insetX={insetX}
        width={width}
      />
    </span>
  );
}

export { Spinner };
