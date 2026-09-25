"use client";

import { ExternalLinkIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { useRecentDrafts } from "./use-recent-drafts";

// Drafts this app created, newest first. Never blocks the wizard.
export function RecentDrafts() {
  const query = useRecentDrafts();

  return (
    <section aria-labelledby="recent-drafts-heading" className="flex flex-col gap-3">
      <h3 id="recent-drafts-heading" className="text-sm font-medium text-muted-foreground">
        Recent drafts
      </h3>
      {query.isPending ? (
        <div className="flex flex-col gap-2" aria-busy aria-label="Loading recent drafts">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-muted-foreground">Could not load recent drafts.</p>
      ) : query.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No drafts yet.</p>
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
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  {formatDateTime(proposal.updatedAt)}
                  <ExternalLinkIcon aria-hidden className="size-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
