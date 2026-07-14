import type * as React from "react";

import type { CurveChannel, MixerChannel } from "../control-types";
import { SegmentedControl } from "../segmented";

type Channel = CurveChannel | MixerChannel;

export const channelMeta = {
  B: { color: "#147CE4" },
  G: { color: "#3BA641" },
  R: { color: "var(--destructive)" },
  RGB: { color: "var(--foreground)" },
} as const;

export function ChannelTabs<T extends Channel>({
  ariaLabel,
  channels,
  name,
  onValueChange,
  value,
}: {
  ariaLabel?: string;
  channels: readonly T[];
  name: string;
  onValueChange: (value: T) => void;
  value: T;
}): React.JSX.Element {
  return (
    <SegmentedControl
      ariaLabel={ariaLabel ?? name}
      name={name}
      onValueChange={(nextValue) => onValueChange(nextValue as T)}
      options={channels.map((channel) => ({
        indicatorColor: channelMeta[channel].color,
        label: channel,
        value: channel,
      }))}
      value={value}
      variant="dots"
    />
  );
}
