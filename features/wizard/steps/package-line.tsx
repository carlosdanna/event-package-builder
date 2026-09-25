"use client";

import { useState } from "react";
import { InfoIcon, RotateCcwIcon, TrashIcon, TriangleAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { availableLabel, unitLabel } from "@/lib/catalog/labels";
import { formatKronor } from "@/lib/format";
import { shortfall, type CapacityIssue, type LineItem } from "@/lib/package";
import { MAX_QUANTITY } from "@/lib/schemas/package-selection";
import { isAllowedQuantity } from "../reducer";

type PackageLineProps = {
  line: LineItem;
  issue?: CapacityIssue;
  onQuantityChange: (quantity: number) => void;
  onReset: () => void;
  onRemove: () => void;
};

export function PackageLine({
  line,
  issue,
  onQuantityChange,
  onReset,
  onRemove,
}: PackageLineProps) {
  const inputId = `quantity-${line.contentId}`;
  const isCustom = line.source === "overridden";
  const available = availableLabel(line);
  const missing = shortfall(line);

  return (
    <li className="flex flex-col gap-2 py-3">
      {/* A fixed actions column, wide enough for reset and remove, keeps every row aligned. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto_7rem_4.25rem]">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{line.title}</span>
            {isCustom && <Badge variant="secondary">Custom</Badge>}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatKronor(line.unitPriceOre)} {unitLabel(line.unit)}
            {available && ` · ${available}`}
          </span>
        </div>

        <QuantityInput
          id={inputId}
          label={`Quantity of ${line.title}`}
          quantity={line.quantity}
          max={line.maxQuantity ?? MAX_QUANTITY}
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

      {issue && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <TriangleAlertIcon aria-hidden className="size-4 shrink-0" />
          {issue.reason}.{" "}
          {line.category === "meeting_space" && line.capacity !== undefined
            ? "Remove it and add a bigger space."
            : "Lower the quantity."}
        </p>
      )}

      {!issue && missing > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <InfoIcon aria-hidden className="size-4 shrink-0" />
          {line.neededQuantity} needed, but the hotel has only {line.maxQuantity} for these dates.
          The other {missing} must be arranged elsewhere.
        </p>
      )}
    </li>
  );
}

type QuantityInputProps = {
  id: string;
  label: string;
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
};

// Holds the typed text, so the field can be empty while typing, and only
// sends whole numbers up to the maximum on. It follows the quantity when it changes elsewhere,
// such as after a reset or a new guest count.
function QuantityInput({ id, label, quantity, max, onChange }: QuantityInputProps) {
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
      max={max}
      step={1}
      className="w-20 text-right tabular-nums max-sm:h-11"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        const next = Number(event.target.value);
        if (event.target.value !== "" && isAllowedQuantity(next) && next <= max) {
          setShownQuantity(next);
          onChange(next);
        }
      }}
      onBlur={() => setText(String(quantity))}
    />
  );
}
