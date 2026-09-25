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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import type { CatalogItem } from "@/lib/catalog/schema";
import { formatMoney } from "@/lib/format";
import { currencyNames, currencySchema, type Currency } from "@/lib/money";
import { ESTIMATE_GUESTS, estimatePerPerson } from "@/lib/package";
import { templates, type Template, type TemplateIcon, type TemplateId } from "@/lib/templates";
import { Field } from "./field";

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
  currency: Currency;
  onSelect: (templateId: TemplateId) => void;
  onCurrencyChange: (currency: Currency) => void;
};

export function TemplateStep(props: TemplateStepProps) {
  const { catalog, selected, currency, onSelect, onCurrencyChange } = props;
  return (
    <div className="flex flex-col gap-6">
      <CurrencyPicker currency={currency} onChange={onCurrencyChange} />
      {/* Radio cards: arrow keys move between templates, like any radio group. */}
      <RadioGroup
        aria-label="Event template"
        value={selected ?? ""}
        onValueChange={(value) => onSelect(value as TemplateId)}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            catalog={catalog}
            currency={currency}
          />
        ))}
      </RadioGroup>
    </div>
  );
}

// Each currency has its own price list, so nothing is converted.
function CurrencyPicker({
  currency,
  onChange,
}: {
  currency: Currency;
  onChange: (currency: Currency) => void;
}) {
  return (
    <Field id="currency" label="Currency" hint="Every price in the proposal is in this currency.">
      {(describedBy) => (
        <Select value={currency} onValueChange={(value) => onChange(currencySchema.parse(value))}>
          <SelectTrigger
            id="currency"
            className="w-full sm:max-w-56"
            aria-describedby={describedBy}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencySchema.options.map((option) => (
              <SelectItem key={option} value={option}>
                {currencyNames[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Field>
  );
}

type TemplateCardProps = { template: Template; catalog: CatalogItem[]; currency: Currency };

function TemplateCard({ template, catalog, currency }: TemplateCardProps) {
  const Icon = icons[template.icon];
  const inputId = `template-${template.id}`;
  const estimate = estimatePerPerson(template, catalog, currency);

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

      {estimate !== null && (
        <Typography as="span" size="sm" className="mt-auto">
          From{" "}
          <Typography as="span" weight="medium">
            {formatMoney(estimate, currency)}
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
