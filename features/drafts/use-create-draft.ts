"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson, RequestError } from "@/features/shared/fetch-json";
import { createProposalResponseSchema, type CreateProposalRequest } from "@/lib/schemas/proposal";
import { RECENT_DRAFTS_KEY } from "./use-recent-drafts";

// The server makes up to two calls to Proposales, each with a 10 second limit.
const CREATE_TIMEOUT_MS = 35_000;

async function createDraft(request: CreateProposalRequest) {
  try {
    return await fetchJson("/api/proposals", createProposalResponseSchema, {
      method: "POST",
      body: request,
      timeoutMs: CREATE_TIMEOUT_MS,
      fallbackMessage: "Could not create the draft proposal.",
    });
  } catch (error) {
    throw isTimeout(error) ? mayExistError() : error;
  }
}

function isTimeout(error: unknown) {
  return error instanceof RequestError && (error.kind === "timeout" || error.status === 504);
}

// Proposales may have created the draft even though the answer never came back.
function mayExistError() {
  return new RequestError(
    "timeout",
    "Proposales did not answer in time. The draft may still have been created, so check recent drafts before trying again.",
  );
}

// Sends the salesperson's choices, never prices: the server recalculates them.
export function useCreateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDraft,
    // Also after a failure, since a timed-out draft may exist after all.
    onSettled: () => queryClient.invalidateQueries({ queryKey: RECENT_DRAFTS_KEY }),
  });
}
