"use client";

import { useEffect } from "react";
import { CircleAlertIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorScreenProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

// Shown instead of a blank page when the wizard fails while rendering.
export default function ErrorScreen({ error, retry }: ErrorScreenProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <CircleAlertIcon aria-hidden className="size-10 text-destructive" />
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">
        The page stopped working. Try again; if it keeps happening, reload the page.
      </p>
      <Button onClick={retry}>
        <RotateCcwIcon aria-hidden />
        Try again
      </Button>
    </main>
  );
}
