"use client";

import {
  HeartIcon,
  MountainIcon,
  PresentationIcon,
  RocketIcon,
  UtensilsCrossedIcon,
  type LucideIcon,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Typography } from "@/components/ui/typography";
import type { CatalogItem } from "@/lib/catalog/schema";
import { formatKronor } from "@/lib/format";
import { ESTIMATE_GUESTS, estimatePerPersonOre } from "@/lib/package";
import { templates, type Template, type TemplateIcon, type TemplateId } from "@/lib/templates";

const icons: Record<TemplateIcon, LucideIcon> = {
  Presentation: PresentationIcon,
  Heart: HeartIcon,
  Mountain: MountainIcon,
  UtensilsCrossed: UtensilsCrossedIcon,
  Rocket: RocketIcon,
};

type TemplateStepProps = {
  catalog: CatalogItem[];
  selected: TemplateId | null;
  onSelect: (templateId: TemplateId) => void;
};

// Radio cards: arrow keys move between templates, like any radio group.
export function TemplateStep({ catalog, selected, onSelect }: TemplateStepProps) {
  return (
    <RadioGroup
      aria-label="Event template"
      value={selected ?? ""}
      onValueChange={(value) => onSelect(value as TemplateId)}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} catalog={catalog} />
      ))}
    </RadioGroup>
  );
}

function TemplateCard({ template, catalog }: { template: Template; catalog: CatalogItem[] }) {
  const Icon = icons[template.icon];
  const inputId = `template-${template.id}`;
  const estimateOre = estimatePerPersonOre(template, catalog);

  return (
    <label
      htmlFor={inputId}
      className="relative flex cursor-pointer flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-[[data-state=checked]]:bg-muted/40 has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary"
    >
      <span className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon aria-hidden className="size-5" />
        </span>
        <span className="flex flex-1 flex-col gap-1">
          <Typography as="span" weight="medium">{template.name}</Typography>
          <Typography as="span" size="sm" color="muted">{template.description}</Typography>
        </span>
        <RadioGroupItem id={inputId} value={template.id} className="mt-1" />
      </span>

      <ul className="flex flex-wrap gap-1.5" aria-label={`Included in ${template.name}`}>
        {includedItems(template).map((item) => (
          <li key={item} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>

      {estimateOre !== null && (
        <Typography as="span" size="sm" className="mt-auto">
          From{" "}
          <Typography as="span" weight="medium">
            {formatKronor(estimateOre)}
          </Typography>{" "}
          per person
          <Typography as="span" color="muted"> for {ESTIMATE_GUESTS} guests</Typography>
        </Typography>
      )}
    </label>
  );
}

function includedItems(template: Template) {
  const items = template.items.map((item) =>
    item.kind === "item" ? item.title : "Meeting space sized to your group",
  );
  if (template.rooms.kind === "per_guests") {
    const { title, guestsPerRoom } = template.rooms;
    items.push(
      guestsPerRoom === 1
        ? `${title}, one per guest`
        : `${title}, one per ${guestsPerRoom} guests`,
    );
  }
  return items;
}
