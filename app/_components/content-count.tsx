"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { contentListResponseSchema, routeErrorSchema } from "@/lib/schemas";

async function fetchContent() {
  const response = await fetch("/api/content");
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = routeErrorSchema.safeParse(body);
    throw new Error(parsed.success ? parsed.data.error : "Could not load content.");
  }
  return contentListResponseSchema.parse(body);
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
      {count} content {count === 1 ? "item" : "items"} in Proposales
    </p>
  );
}
