"use client";

import { useQuery } from "@tanstack/react-query";
import { catalogResponseSchema, routeErrorSchema } from "@/lib/schemas";

// The catalog changes rarely, so one load per hour is plenty.
const CATALOG_STALE_TIME = 60 * 60 * 1000;

async function fetchCatalog() {
  const response = await fetch("/api/content");
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = routeErrorSchema.safeParse(body);
    throw new Error(parsed.success ? parsed.data.error : "Could not load the catalog.");
  }
  return catalogResponseSchema.parse(body).items;
}

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    staleTime: CATALOG_STALE_TIME,
  });
}
