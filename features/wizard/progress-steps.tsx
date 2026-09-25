"use client";

import { CheckIcon } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { STEPS } from "./reducer";

type ProgressStepsProps = {
  current: number;
  isReachable: (step: number) => boolean;
  onSelect: (step: number) => void;
};

// Steps already reached are buttons, so the salesperson can jump back.
export function ProgressSteps({ current, isReachable, onSelect }: ProgressStepsProps) {
  return (
    <nav aria-label="Wizard progress">
      <ol className="grid grid-cols-5 gap-2">
        {STEPS.map((step, index) => {
          const isCurrent = index === current;
          const isDone = index < current;
          const reachable = !isCurrent && isReachable(index);
          const content = (
            <>
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-full rounded-full bg-muted transition-colors",
                  (isDone || isCurrent) && "bg-primary",
                )}
              />
              {/* Five labels do not fit a phone, so there they are for screen readers only. */}
              <span className="flex items-center gap-1.5 text-sm max-sm:sr-only">
                <span
                  aria-hidden
                  className={cn(
                    "hidden size-5 shrink-0 items-center justify-center rounded-full border text-[0.7rem] sm:flex",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isDone && "border-primary text-primary",
                  )}
                >
                  {isDone ? <CheckIcon className="size-3" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "truncate",
                    isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </span>
            </>
          );

          return (
            <li key={step.id} aria-current={isCurrent ? "step" : undefined}>
              {reachable ? (
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className="flex w-full flex-col gap-2 rounded-md text-left outline-none max-sm:min-h-11 max-sm:justify-center hover:[&>span:last-child>span:last-child]:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {content}
                  <span className="sr-only">, go to step {index + 1}</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2 max-sm:min-h-11 max-sm:justify-center">
                  {content}
                  <span className="sr-only">
                    {isCurrent ? ", current step" : isDone ? "" : ", not reached yet"}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <Typography aria-hidden size="sm" color="muted" className="mt-3 sm:hidden">
        Step {current + 1} of {STEPS.length}:{" "}
        <Typography as="span" weight="medium" color="foreground">{STEPS[current].label}</Typography>
      </Typography>
    </nav>
  );
}
