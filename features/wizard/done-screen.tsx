"use client";

import { useEffect, useRef } from "react";
import { CircleCheckIcon, ExternalLinkIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { formatMoney } from "@/lib/format";
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
          <Typography as="h2" ref={headingRef} tabIndex={-1} className="outline-none">
            Draft proposal created
          </Typography>
          <Typography size="sm" color="muted">{proposal.title}</Typography>
          <Typography size="lg" weight="semibold" className="tabular-nums">
            {formatMoney(proposal.subtotal, proposal.currency)}
            <Typography as="span" size="sm" weight="normal" color="muted">
              {" "}
              excluding tax
            </Typography>
          </Typography>
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
