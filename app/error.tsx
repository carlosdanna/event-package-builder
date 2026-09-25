"use client";

import { useEffect } from "react";
import { CircleAlertIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

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
      <Typography as="h1" size="xl">Something went wrong</Typography>
      <Typography color="muted">
        The page stopped working. Try again; if it keeps happening, reload the page.
      </Typography>
      <Button onClick={retry}>
        <RotateCcwIcon aria-hidden />
        Try again
      </Button>
    </main>
  );
}
