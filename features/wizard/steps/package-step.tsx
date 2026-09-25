"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/catalog/labels";
import { catalogCategorySchema, type CatalogItem } from "@/lib/catalog/schema";
import { addableItems, type CapacityIssue, type LineItem } from "@/lib/package";
import { AddItemDialog } from "./add-item-dialog";
import { PackageLine } from "./package-line";

type PackageStepProps = {
  lines: LineItem[];
  catalog: CatalogItem[];
  guests: number;
  issues: CapacityIssue[];
  onQuantityChange: (line: LineItem, quantity: number) => void;
  onReset: (contentId: number) => void;
  onRemove: (contentId: number) => void;
  onAdd: (contentId: number) => void;
};

export function PackageStep({
  lines,
  catalog,
  guests,
  issues,
  onQuantityChange,
  onReset,
  onRemove,
  onAdd,
}: PackageStepProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const addable = addableItems(lines, catalog);

  return (
    <div className="flex flex-col gap-6">
      {lines.length === 0 && (
        <p className="text-sm text-muted-foreground">
          The package is empty. Add items from the catalog.
        </p>
      )}

      {catalogCategorySchema.options.map((category) => {
        const inSection = lines.filter((line) => line.category === category);
        if (inSection.length === 0) return null;
        const headingId = `section-${category}`;
        return (
          <section key={category} aria-labelledby={headingId}>
            <h3 id={headingId} className="text-sm font-medium text-muted-foreground">
              {categoryLabel(category)}
            </h3>
            <ul className="divide-y">
              {inSection.map((line) => (
                <PackageLine
                  key={line.contentId}
                  line={line}
                  issue={issues.find((issue) => issue.contentId === line.contentId)}
                  onQuantityChange={(quantity) => onQuantityChange(line, quantity)}
                  onReset={() => onReset(line.contentId)}
                  onRemove={() => onRemove(line.contentId)}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <div>
        <Button variant="outline" onClick={() => setDialogOpen(true)} disabled={addable.length === 0}>
          <PlusIcon aria-hidden />
          Add item
        </Button>
      </div>

      <AddItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        items={addable}
        guests={guests}
        onAdd={onAdd}
      />
    </div>
  );
}
