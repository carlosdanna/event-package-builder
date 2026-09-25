"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogResponseSchema, routeErrorSchema } from "@/lib/schemas";

async function fetchContent() {
  const response = await fetch("/api/content");
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = routeErrorSchema.safeParse(body);
    throw new Error(parsed.success ? parsed.data.error : "Could not load the catalog.");
  }
  return catalogResponseSchema.parse(body);
}

export function useContent() {
  return useQuery({ queryKey: ["content"], queryFn: fetchContent });
}

export function ContentCount() {
  const { data, error, isPending } = useContent();

  if (isPending) return <Skeleton className="h-5 w-56" />;

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error.message}
      </p>
    );
  }

  const count = data.items.length;
  return (
    <p className="text-sm text-muted-foreground">
      {count} catalog {count === 1 ? "item" : "items"} from Proposales
    </p>
  );
}
