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
import { formatKronor } from "@/lib/format";
import { budgetUsage, type LineItem, type PackageSummary } from "@/lib/package";
import { cn } from "@/lib/utils";

export type SummaryProps = {
  lines: LineItem[];
  summary: PackageSummary | null; // null until a template and valid basics exist
  budgetOre: number | null;
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
  const total = props.summary ? formatKronor(props.summary.subtotalOre) : "No package yet";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <Sheet>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total excluding tax</span>
            <span className="font-semibold tabular-nums">{total}</span>
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

export function SummaryContent({ lines, summary, budgetOre }: SummaryProps) {
  if (!summary) {
    return (
      <p className="text-sm text-muted-foreground">
        Pick a template and enter guests and dates to see the price.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">The package is empty.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {lines.map((line) => (
            <li key={line.contentId} className="flex justify-between gap-3">
              <span className="min-w-0">
                {line.title}
                <span className="text-muted-foreground"> × {line.quantity}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatKronor(line.lineTotalOre)}</span>
            </li>
          ))}
        </ul>
      )}

      <Separator />

      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="font-medium">Subtotal</dt>
          <dd className="font-semibold tabular-nums" aria-live="polite">
            {formatKronor(summary.subtotalOre)}
          </dd>
        </div>
        {summary.perPersonOre !== null && (
          <div className="flex justify-between gap-3 text-muted-foreground">
            <dt>Per person</dt>
            <dd className="tabular-nums">{formatKronor(summary.perPersonOre)}</dd>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Prices exclude tax.</p>
      </dl>

      <BudgetBar subtotalOre={summary.subtotalOre} budgetOre={budgetOre} status={summary.budget} />
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
  subtotalOre: number;
  budgetOre: number | null;
  status: PackageSummary["budget"];
};

function BudgetBar({ subtotalOre, budgetOre, status }: BudgetBarProps) {
  const usage = budgetUsage(subtotalOre, budgetOre);
  if (!usage || budgetOre === null || status === "none") return null;
  const colours = budgetColours[status];
  const text =
    usage.overOre > 0
      ? `${formatKronor(usage.overOre)} over budget`
      : `${usage.percent}% of budget`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-3 text-sm">
        <span className={cn("font-medium", colours.text)}>{text}</span>
        <span className="text-muted-foreground tabular-nums">{formatKronor(budgetOre)}</span>
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
