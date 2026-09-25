"use client";

import { useQuery } from "@tanstack/react-query";
import { recentProposalsResponseSchema, routeErrorSchema } from "@/lib/schemas";

export const RECENT_PROPOSALS_KEY = ["proposals"];

async function fetchRecentProposals() {
  const response = await fetch("/api/proposals");
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = routeErrorSchema.safeParse(body);
    throw new Error(parsed.success ? parsed.data.error : "Could not load recent drafts.");
  }
  return recentProposalsResponseSchema.parse(body).items;
}

export function useRecentProposals() {
  return useQuery({ queryKey: RECENT_PROPOSALS_KEY, queryFn: fetchRecentProposals });
}
