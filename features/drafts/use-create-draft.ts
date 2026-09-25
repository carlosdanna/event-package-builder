"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProposalResponseSchema,
  routeErrorSchema,
  type CreateProposalRequest,
} from "@/lib/schemas";
import { RECENT_DRAFTS_KEY } from "./use-recent-drafts";

async function createDraft(request: CreateProposalRequest) {
  const response = await fetch("/api/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }).catch(() => {
    throw new Error("Could not reach the server. Check the connection and try again.");
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = routeErrorSchema.safeParse(body);
    throw new Error(parsed.success ? parsed.data.error : "Could not create the draft proposal.");
  }
  return createProposalResponseSchema.parse(body);
}

// Sends the salesperson's choices, never prices: the server recalculates them.
export function useCreateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDraft,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECENT_DRAFTS_KEY }),
  });
}
