"use client";

import { ExternalLinkIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { formatDateTime } from "@/lib/format";
import { useRecentDrafts } from "./use-recent-drafts";

// Drafts this app created, newest first. Never blocks the wizard.
export function RecentDrafts() {
  const query = useRecentDrafts();

  return (
    <section aria-labelledby="recent-drafts-heading" className="flex flex-col gap-3">
      <Typography as="h3" id="recent-drafts-heading" variant="h4" color="muted">
        Recent drafts
      </Typography>
      {query.isPending ? (
        <div className="flex flex-col gap-2" aria-busy aria-label="Loading recent drafts">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : query.isError ? (
        <Typography size="sm" color="muted">Could not load recent drafts.</Typography>
      ) : query.data.length === 0 ? (
        <Typography size="sm" color="muted">No drafts yet.</Typography>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border text-sm">
          {query.data.map((proposal) => (
            <li key={proposal.uuid}>
              <a
                href={proposal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-3 py-2 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="min-w-0 truncate">{proposal.title || "Untitled proposal"}</span>
                <Typography as="span" color="muted" className="flex shrink-0 items-center gap-2">
                  {formatDateTime(proposal.updatedAt)}
                  <ExternalLinkIcon aria-hidden className="size-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </Typography>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
