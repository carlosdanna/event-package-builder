"use client";

import { ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { formatMoney } from "@/lib/format";
import type { Currency } from "@/lib/money";
import { budgetUsage, type LineItem, type PackageSummary } from "@/lib/package";
import { cn } from "@/lib/utils";

export type SummaryProps = {
  lines: LineItem[];
  summary: PackageSummary | null; // null until a template and valid basics exist
  budget: number | null;
  currency: Currency;
};

// Live package summary for wide screens, beside the current step.
export function Summary(props: SummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <SummaryContent {...props} />
      </CardContent>
    </Card>
  );
}

// On phones the summary is a bar with the total that opens a sheet with the details.
export function MobileSummaryBar(props: SummaryProps) {
  const total = props.summary ? formatMoney(props.summary.subtotal, props.currency) : "No package yet";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <Sheet>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex flex-col">
            <Typography as="span" size="xs" color="muted">Total excluding tax</Typography>
            {/* The desktop summary is hidden on phones, so the total is announced here. */}
            <Typography
              as="span"
              aria-live="polite"
              aria-atomic="true"
              weight="semibold"
              className="tabular-nums"
            >
              {total}
            </Typography>
          </div>
          <SheetTrigger asChild>
            <Button variant="outline">
              <ChevronUpIcon aria-hidden />
              Details
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto px-4 pb-6">
          <SheetHeader className="px-0">
            <SheetTitle>Summary</SheetTitle>
            <SheetDescription>Prices exclude tax.</SheetDescription>
          </SheetHeader>
          <SummaryContent {...props} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function SummaryContent({ lines, summary, budget, currency }: SummaryProps) {
  if (!summary) {
    return (
      <Typography size="sm" color="muted">
        Pick a template and enter guests and dates to see the price.
      </Typography>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {lines.length === 0 ? (
        <Typography size="sm" color="muted">The package is empty.</Typography>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {lines.map((line) => (
            <li key={line.contentId} className="flex justify-between gap-3">
              <span className="min-w-0">
                {line.title}
                <Typography as="span" color="muted"> × {line.quantity}</Typography>
              </span>
              <span className="shrink-0 tabular-nums">{formatMoney(line.lineTotal, currency)}</span>
            </li>
          ))}
        </ul>
      )}

      <Separator />

      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="font-medium">Subtotal</dt>
          <dd className="font-semibold tabular-nums" aria-live="polite">
            {formatMoney(summary.subtotal, currency)}
          </dd>
        </div>
        {summary.perPerson !== null && (
          <div className="flex justify-between gap-3 text-muted-foreground">
            <dt>Per person</dt>
            <dd className="tabular-nums">{formatMoney(summary.perPerson, currency)}</dd>
          </div>
        )}
        <Typography size="xs" color="muted">Prices exclude tax.</Typography>
      </dl>

      <BudgetBar
        subtotal={summary.subtotal}
        budget={budget}
        currency={currency}
        status={summary.budgetStatus}
      />
    </div>
  );
}

const budgetColours = {
  ok: { bar: "", text: "text-muted-foreground" },
  near: {
    bar: "*:data-[slot=progress-indicator]:bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  over: {
    bar: "*:data-[slot=progress-indicator]:bg-destructive",
    text: "text-destructive",
  },
} as const;

type BudgetBarProps = {
  subtotal: number;
  budget: number | null;
  currency: Currency;
  status: PackageSummary["budgetStatus"];
};

function BudgetBar({ subtotal, budget, currency, status }: BudgetBarProps) {
  const usage = budgetUsage(subtotal, budget);
  if (!usage || budget === null || status === "none") return null;
  const colours = budgetColours[status];
  const text =
    usage.over > 0
      ? `${formatMoney(usage.over, currency)} over budget`
      : `${usage.percent}% of budget`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-3 text-sm">
        <span className={cn("font-medium", colours.text)}>{text}</span>
        <Typography as="span" color="muted" className="tabular-nums">
          {formatMoney(budget, currency)}
        </Typography>
      </div>
      <Progress
        value={Math.min(usage.percent, 100)}
        aria-label={`Budget used: ${text}`}
        className={cn("h-2", colours.bar)}
      />
    </div>
  );
}

export function SummarySkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-2 h-5 w-full" />
    </div>
  );
}
