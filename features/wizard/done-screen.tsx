"use client";

import { useEffect, useRef } from "react";
import { CircleCheckIcon, ExternalLinkIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatKronor } from "@/lib/format";
import type { CreateProposalResponse } from "@/lib/schemas";

type DoneScreenProps = {
  proposal: CreateProposalResponse;
  onStartOver: () => void;
};

export function DoneScreen({ proposal, onStartOver }: DoneScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Screen reader and keyboard users land on the result.
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardContent className="flex flex-col items-center gap-6 py-6 text-center">
        <CircleCheckIcon aria-hidden className="size-12 text-emerald-600 dark:text-emerald-400" />
        <div className="flex flex-col gap-2">
          <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
            Draft proposal created
          </h2>
          <p className="text-muted-foreground">{proposal.title}</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatKronor(proposal.subtotalOre)}
            <span className="text-sm font-normal text-muted-foreground"> excluding tax</span>
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <a href={proposal.url} target="_blank" rel="noopener noreferrer">
              Open the draft in Proposales
              <ExternalLinkIcon aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
          <Button variant="outline" onClick={onStartOver}>
            <RotateCcwIcon aria-hidden />
            Build another package
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
