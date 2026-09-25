"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/features/shared/fetch-json";
import { catalogResponseSchema } from "@/lib/schemas/content";

// The catalog changes rarely, so one load per hour is plenty.
const CATALOG_STALE_TIME = 60 * 60 * 1000;
const CATALOG_TIMEOUT_MS = 20_000;

async function fetchCatalog({ signal }: { signal: AbortSignal }) {
  const body = await fetchJson("/api/content", catalogResponseSchema, {
    signal,
    timeoutMs: CATALOG_TIMEOUT_MS,
    fallbackMessage: "Could not load the catalog.",
  });
  return body.items;
}

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    staleTime: CATALOG_STALE_TIME,
    // One quick retry covers a blip; a setup problem should show without a long wait.
    retry: 1,
  });
}
