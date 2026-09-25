"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequestError } from "@/features/shared/fetch-json";
import { useSignOut } from "./use-session";

function isSignedOutError(error: unknown) {
  return error instanceof RequestError && error.status === 401;
}

// Tells the user their session has ended, either when its time runs out or
// when a route handler answers that nobody is signed in. It cannot be closed:
// the only way on is to sign in again.
export function SessionExpiryDialog({ expiresAt }: { expiresAt: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signOut = useSignOut();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExpired(true), Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);

  useEffect(() => {
    const unsubscribeQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error" && isSignedOutError(event.action.error)) {
        setExpired(true);
      }
    });
    const unsubscribeMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error" && isSignedOutError(event.action.error)) {
        setExpired(true);
      }
    });
    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [queryClient]);

  // The cookie is cleared on the server too, in case the browser's clock ran
  // ahead of it; otherwise /login would send a still-valid session back here.
  // Signing out also drops the cached answers of the ended session.
  function signInAgain() {
    signOut.mutate(undefined, { onSettled: () => router.replace("/login") });
  }

  return (
    <Dialog open={expired}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Your session expired</DialogTitle>
          <DialogDescription>
            You are signed out after 10 minutes. Sign in again to continue. Changes you have not
            saved as a draft are lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button autoFocus disabled={signOut.isPending} onClick={signInAgain}>
            Sign in again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
