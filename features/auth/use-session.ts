"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/features/shared/fetch-json";
import { sessionResponseSchema, type SignInRequest } from "@/lib/schemas/session";

const SESSION_TIMEOUT_MS = 10_000;

export function useSignIn() {
  return useMutation({
    mutationFn: (request: SignInRequest) =>
      fetchJson("/api/session", sessionResponseSchema, {
        method: "POST",
        body: request,
        timeoutMs: SESSION_TIMEOUT_MS,
        fallbackMessage: "Could not sign in.",
      }),
  });
}

// Cached answers belong to the signed-in session, so they are dropped on the way out.
export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson("/api/session", sessionResponseSchema, {
        method: "DELETE",
        timeoutMs: SESSION_TIMEOUT_MS,
        fallbackMessage: "Could not sign out.",
      }),
    onSuccess: () => queryClient.clear(),
  });
}
