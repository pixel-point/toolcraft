"use client";

import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import { Button, Field } from "../../primitives";

export type CollectionActionsControlProps = {
  addLabel?: string;
  canAdd?: boolean;
  canRemove?: boolean;
  name: string;
  onAdd?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
};

export function CollectionActionsControl({
  addLabel = "Add item",
  canAdd = true,
  canRemove = true,
  name,
  onAdd,
  onRemove,
  removeLabel = "Remove item",
}: CollectionActionsControlProps): React.JSX.Element {
  return (
    <Field
      aria-label={name}
      className="min-w-0 items-center justify-between gap-2"
      data-slot="collection-actions-control-header"
      orientation="horizontal"
    >
      <ControlFieldLabel className="flex-1">{name}</ControlFieldLabel>
      <div className="inline-flex shrink-0 items-center gap-1">
        <Button
          aria-label={removeLabel}
          disabled={!canRemove}
          onClick={onRemove}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <MinusIcon />
        </Button>
        <Button
          aria-label={addLabel}
          disabled={!canAdd}
          onClick={onAdd}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <PlusIcon />
        </Button>
      </div>
    </Field>
  );
}
