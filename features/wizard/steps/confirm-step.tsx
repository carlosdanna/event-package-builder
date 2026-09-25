"use client";

import { CircleAlertIcon, LoaderCircleIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { unitLabel } from "@/lib/catalog/labels";
import { formatDateRange, formatKronor, plural } from "@/lib/format";
import {
  eventLength,
  type CapacityIssue,
  type LineItem,
  type PackageSummary,
} from "@/lib/package";
import type { CustomerDetails } from "@/lib/schemas/customer";
import type { EventBasics } from "@/lib/schemas/event-basics";
import type { Template } from "@/lib/templates";
import { cn } from "@/lib/utils";

type ConfirmStepProps = {
  template: Template;
  basics: EventBasics;
  budgetOre: number | null;
  lines: LineItem[];
  summary: PackageSummary;
  issues: CapacityIssue[];
  customer: CustomerDetails;
  pending: boolean;
  onEdit: (step: number) => void;
  onCreate: () => void;
};

// Read-only check of everything before the draft is created.
export function ConfirmStep(props: ConfirmStepProps) {
  const { template, basics, budgetOre, lines, summary, issues, customer } = props;
  const { days } = eventLength(basics.startDate, basics.endDate);
  const isEmpty = !lines.some((line) => line.quantity > 0);
  const hasIssues = issues.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <ReviewSection title="Event" onEdit={() => props.onEdit(1)} editLabel="Edit event basics">
        <Details
          rows={[
            ["Template", template.name],
            ["Guests", String(basics.guests)],
            ["Dates", `${formatDateRange(basics.startDate, basics.endDate)}, ${plural(days, "day")}`],
            ["Budget", budgetOre === null ? "Not set" : formatKronor(budgetOre)],
          ]}
        />
      </ReviewSection>

      <ReviewSection title="Package" onEdit={() => props.onEdit(2)} editLabel="Edit the package">
        {issues.map((issue) => (
          <p key={issue.contentId} className="flex items-center gap-2 text-sm text-destructive">
            <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
            {issue.title}: {issue.reason}
          </p>
        ))}
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">The package is empty.</p>
        ) : (
          <PackageTable lines={lines} summary={summary} />
        )}
      </ReviewSection>

      <ReviewSection title="Customer" onEdit={() => props.onEdit(3)} editLabel="Edit customer details">
        <Details
          rows={[
            ["Company", customer.company],
            ["Contact", customer.contactName],
            ["Email", customer.contactEmail],
            ["Notes", customer.notes ?? "None"],
          ]}
        />
      </ReviewSection>

      <div className="flex flex-col gap-2 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isEmpty
            ? "Add at least one item to the package first."
            : hasIssues
              ? "Fix the package above before creating the draft."
              : "Creates a draft in Proposales. Nothing is sent to the customer."}
        </p>
        <Button size="lg" onClick={props.onCreate} disabled={props.pending || isEmpty || hasIssues}>
          {props.pending && <LoaderCircleIcon aria-hidden className="animate-spin" />}
          {props.pending ? "Creating draft…" : "Create draft proposal"}
        </Button>
      </div>
    </div>
  );
}

type ReviewSectionProps = {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: React.ReactNode;
};

function ReviewSection({ title, editLabel, onEdit, children }: ReviewSectionProps) {
  const headingId = `review-${title.toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id={headingId} className="font-medium">
          {title}
        </h3>
        <Button
          variant="link"
          size="sm"
          className="max-sm:h-11"
          onClick={onEdit}
          aria-label={editLabel}
        >
          <PencilIcon aria-hidden />
          Edit
        </Button>
      </div>
      {children}
    </section>
  );
}

function Details({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-line break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// On phones, quantity and unit price move under the item name, so the table fits.
function PackageTable({ lines, summary }: { lines: LineItem[]; summary: PackageSummary }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right max-sm:hidden">Quantity</TableHead>
          <TableHead className="text-right max-sm:hidden">Unit price</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.contentId}>
            <TableCell className="whitespace-normal">
              {line.title}
              <span className="block text-xs text-muted-foreground tabular-nums sm:hidden">
                {line.quantity} × {formatKronor(line.unitPriceOre)} {unitLabel(line.unit)}
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums max-sm:hidden">{line.quantity}</TableCell>
            <TableCell className="text-right whitespace-normal tabular-nums max-sm:hidden">
              {formatKronor(line.unitPriceOre)}
              <span className="block text-xs text-muted-foreground">{unitLabel(line.unit)}</span>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatKronor(line.lineTotalOre)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <FooterLabel>Subtotal, excluding tax</FooterLabel>
          <TableCell className="text-right font-semibold tabular-nums">
            {formatKronor(summary.subtotalOre)}
          </TableCell>
        </TableRow>
        {summary.perPersonOre !== null && (
          <TableRow>
            <FooterLabel className="font-normal text-muted-foreground">Per person</FooterLabel>
            <TableCell className="text-right font-normal text-muted-foreground tabular-nums">
              {formatKronor(summary.perPersonOre)}
            </TableCell>
          </TableRow>
        )}
      </TableFooter>
    </Table>
  );
}

// Spans the item, quantity and unit price columns, or just the item column on phones.
function FooterLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <>
      <TableCell colSpan={3} className={cn(className, "max-sm:hidden")}>
        {children}
      </TableCell>
      <TableCell className={cn(className, "sm:hidden")}>{children}</TableCell>
    </>
  );
}
