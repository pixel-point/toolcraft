"use client";

import * as React from "react";

import type { MixerChannel } from "../control-types";
import { ChannelTabs } from "../channel-tabs";
import { SliderControl } from "../slider";

export type ChannelMixerValues = Record<
  MixerChannel,
  Record<MixerChannel, number>
>;

export type ChannelMixerControlProps = {
  baseValues?: ChannelMixerValues;
  name?: string;
  onValueChange?: (value: {
    activeChannel: MixerChannel;
    baseValues?: ChannelMixerValues;
    values: ChannelMixerValues;
  }) => void;
  values: ChannelMixerValues;
};

const anchorChannels = [
  "R",
  "G",
  "B",
] as const satisfies readonly MixerChannel[];
const channelMixerSliderMax = 200;
const channelMixerSliderMin = -200;
const defaultActiveChannel = anchorChannels[0];
const channelMeta = {
  B: { label: "Blue" },
  G: { label: "Green" },
  R: { label: "Red" },
} as const;

export function ChannelMixerControl({
  baseValues,
  name = "Channels",
  onValueChange,
  values,
}: ChannelMixerControlProps): React.JSX.Element {
  const [activeChannel, setActiveChannel] =
    React.useState<MixerChannel>(defaultActiveChannel);
  const activeValues = values[activeChannel];

  function updateValue(channel: MixerChannel, nextValue: number): void {
    onValueChange?.({
      activeChannel,
      baseValues,
      values: {
        ...values,
        [activeChannel]: { ...activeValues, [channel]: nextValue },
      },
    });
  }

  function updateActiveChannel(nextChannel: MixerChannel): void {
    setActiveChannel(nextChannel);
    onValueChange?.({
      activeChannel: nextChannel,
      baseValues,
      values,
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-3" aria-label={name}>
      <div className="flex min-w-0 flex-col gap-2">
        <ChannelTabs
          ariaLabel={name}
          channels={anchorChannels}
          name={name}
          onValueChange={updateActiveChannel}
          value={activeChannel}
        />
      </div>
      {anchorChannels.map((channel) => (
        <SliderControl
          baseValue={baseValues?.[activeChannel]?.[channel]}
          key={channel}
          max={channelMixerSliderMax}
          min={channelMixerSliderMin}
          name={channelMeta[channel].label}
          onValueChange={(nextValue) => updateValue(channel, nextValue)}
          step={1}
          unit="%"
          value={activeValues[channel]}
        />
      ))}
    </div>
  );
}
