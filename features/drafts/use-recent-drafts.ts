"use client";

import { useQuery } from "@tanstack/react-query";
import { recentProposalsResponseSchema, routeErrorSchema } from "@/lib/schemas";

export const RECENT_DRAFTS_KEY = ["proposals"];

async function fetchRecentDrafts() {
  const response = await fetch("/api/proposals");
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = routeErrorSchema.safeParse(body);
    throw new Error(parsed.success ? parsed.data.error : "Could not load recent drafts.");
  }
  return recentProposalsResponseSchema.parse(body).items;
}

export function useRecentDrafts() {
  return useQuery({ queryKey: RECENT_DRAFTS_KEY, queryFn: fetchRecentDrafts });
}
