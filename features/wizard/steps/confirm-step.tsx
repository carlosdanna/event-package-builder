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

type ConfirmStepProps = {
  template: Template;
  basics: EventBasics;
  budgetOre: number | null;
  lines: LineItem[];
  summary: PackageSummary;
  capacityIssues: CapacityIssue[];
  customer: CustomerDetails;
  pending: boolean;
  onEdit: (step: number) => void;
  onCreate: () => void;
};

// Read-only check of everything before the draft is created.
export function ConfirmStep(props: ConfirmStepProps) {
  const { template, basics, budgetOre, lines, summary, capacityIssues, customer } = props;
  const { days } = eventLength(basics.startDate, basics.endDate);
  const isEmpty = !lines.some((line) => line.quantity > 0);

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
        {capacityIssues.map((issue) => (
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
            : "Creates a draft in Proposales. Nothing is sent to the customer."}
        </p>
        <Button size="lg" onClick={props.onCreate} disabled={props.pending || isEmpty}>
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
        <Button variant="link" size="sm" onClick={onEdit} aria-label={editLabel}>
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
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-line break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PackageTable({ lines, summary }: { lines: LineItem[]; summary: PackageSummary }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Unit price</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.contentId}>
            <TableCell className="whitespace-normal">{line.title}</TableCell>
            <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
            <TableCell className="text-right whitespace-normal tabular-nums">
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
          <TableCell colSpan={3}>Subtotal, excluding tax</TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            {formatKronor(summary.subtotalOre)}
          </TableCell>
        </TableRow>
        {summary.perPersonOre !== null && (
          <TableRow>
            <TableCell colSpan={3} className="font-normal text-muted-foreground">
              Per person
            </TableCell>
            <TableCell className="text-right font-normal text-muted-foreground tabular-nums">
              {formatKronor(summary.perPersonOre)}
            </TableCell>
          </TableRow>
        )}
      </TableFooter>
    </Table>
  );
}
