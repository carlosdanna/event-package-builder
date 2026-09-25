"use client";

import { useState } from "react";
import { RotateCcwIcon, TrashIcon, TriangleAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unitLabel } from "@/lib/catalog/labels";
import { formatKronor } from "@/lib/format";
import type { LineItem } from "@/lib/package";
import { MAX_QUANTITY } from "@/lib/schemas/package-selection";
import { isAllowedQuantity } from "../reducer";

type PackageLineProps = {
  line: LineItem;
  capacityReason?: string;
  onQuantityChange: (quantity: number) => void;
  onReset: () => void;
  onRemove: () => void;
};

export function PackageLine({
  line,
  capacityReason,
  onQuantityChange,
  onReset,
  onRemove,
}: PackageLineProps) {
  const inputId = `quantity-${line.contentId}`;
  const isCustom = line.source === "overridden";

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[1fr_auto_7rem_auto]">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{line.title}</span>
            {isCustom && <Badge variant="secondary">Custom</Badge>}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatKronor(line.unitPriceOre)} {unitLabel(line.unit)}
          </span>
        </div>

        <QuantityInput
          id={inputId}
          label={`Quantity of ${line.title}`}
          quantity={line.quantity}
          onChange={onQuantityChange}
        />

        <span className="text-right font-medium tabular-nums max-sm:col-start-1 max-sm:row-start-2 max-sm:text-left">
          {formatKronor(line.lineTotalOre)}
        </span>

        <div className="flex justify-end gap-1 max-sm:col-start-2 max-sm:row-start-2">
          {isCustom && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="max-sm:size-11"
              onClick={onReset}
              aria-label={`Reset ${line.title} to the suggested ${line.derivedQuantity}`}
              title={`Reset to ${line.derivedQuantity}`}
            >
              <RotateCcwIcon />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="max-sm:size-11"
            onClick={onRemove}
            aria-label={`Remove ${line.title}`}
            title="Remove"
          >
            <TrashIcon />
          </Button>
        </div>
      </div>

      {capacityReason && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <TriangleAlertIcon aria-hidden className="size-4" />
          Too small: {capacityReason}. Remove it and add a bigger space.
        </p>
      )}
    </li>
  );
}

type QuantityInputProps = {
  id: string;
  label: string;
  quantity: number;
  onChange: (quantity: number) => void;
};

// Holds the typed text, so the field can be empty while typing, and only
// sends whole numbers on. It follows the quantity when it changes elsewhere,
// such as after a reset or a new guest count.
function QuantityInput({ id, label, quantity, onChange }: QuantityInputProps) {
  const [text, setText] = useState(String(quantity));
  const [shownQuantity, setShownQuantity] = useState(quantity);

  if (quantity !== shownQuantity) {
    setShownQuantity(quantity);
    setText(String(quantity));
  }

  return (
    <Input
      id={id}
      aria-label={label}
      type="number"
      inputMode="numeric"
      min={0}
      max={MAX_QUANTITY}
      step={1}
      className="w-20 text-right tabular-nums max-sm:h-11"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        const next = Number(event.target.value);
        if (event.target.value !== "" && isAllowedQuantity(next)) {
          setShownQuantity(next);
          onChange(next);
        }
      }}
      onBlur={() => setText(String(quantity))}
    />
  );
}
