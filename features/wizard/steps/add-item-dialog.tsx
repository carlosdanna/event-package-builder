"use client";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { catalogCategorySchema, type CatalogItem } from "@/lib/catalog/schema";
import { availableLabel, categoryLabel, unitLabel } from "@/lib/catalog/labels";
import { formatKronor } from "@/lib/format";
import { meetingSpaceIssue } from "@/lib/package";

type AddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CatalogItem[];
  guests: number;
  onAdd: (contentId: number) => void;
};

// Searchable list of catalog items not yet in the package. Meeting spaces
// that cannot seat every guest are shown but disabled, with the reason.
export function AddItemDialog({ open, onOpenChange, items, guests, onAdd }: AddItemDialogProps) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add an item"
      description="Search the catalog for an item to add to the package."
      showCloseButton
    >
      <Command filter={matchesSearch}>
        <CommandInput placeholder="Search the catalog" />
        <CommandList>
          <CommandEmpty>No items match your search.</CommandEmpty>
          {catalogCategorySchema.options.map((category) => {
            const inCategory = items.filter((item) => item.category === category);
            if (inCategory.length === 0) return null;
            return (
              <CommandGroup key={category} heading={categoryLabel(category)}>
                {inCategory.map((item) => {
                  const issue = meetingSpaceIssue(item, guests);
                  const available = availableLabel(item);
                  return (
                    <CommandItem
                      key={item.contentId}
                      value={`${item.contentId} ${item.title}`}
                      keywords={[item.title, categoryLabel(category)]}
                      disabled={issue !== null}
                      onSelect={() => {
                        onAdd(item.contentId);
                        onOpenChange(false);
                      }}
                    >
                      <span className="flex flex-1 flex-col">
                        <span>{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {issue ??
                            `${formatKronor(item.priceOre)} ${unitLabel(item.unit)}${available ? ` · ${available}` : ""}`}
                        </span>
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

// Plain "contains" matching on the title and category. The default fuzzy
// scoring matches letters spread across words, which surprises people.
function matchesSearch(_value: string, search: string, keywords: string[] = []) {
  const needle = search.trim().toLowerCase();
  return keywords.some((keyword) => keyword.toLowerCase().includes(needle)) ? 1 : 0;
}
