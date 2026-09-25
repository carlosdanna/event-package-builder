"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // One client per browser session, created once so the cache survives re-renders.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        // Top left, so it does not cover the summary bar on phones.
        <ReactQueryDevtools buttonPosition="top-left" />
      )}
    </QueryClientProvider>
  );
}
