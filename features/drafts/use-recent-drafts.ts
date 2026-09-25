"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/features/shared/fetch-json";
import { recentProposalsResponseSchema } from "@/lib/schemas/proposal";

export const RECENT_DRAFTS_KEY = ["drafts"];
const RECENT_DRAFTS_TIMEOUT_MS = 20_000;

async function fetchRecentDrafts({ signal }: { signal: AbortSignal }) {
  const body = await fetchJson("/api/proposals", recentProposalsResponseSchema, {
    signal,
    timeoutMs: RECENT_DRAFTS_TIMEOUT_MS,
    fallbackMessage: "Could not load recent drafts.",
  });
  return body.items;
}

export function useRecentDrafts() {
  return useQuery({ queryKey: RECENT_DRAFTS_KEY, queryFn: fetchRecentDrafts, retry: 1 });
}
