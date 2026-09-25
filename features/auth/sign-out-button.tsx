"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignOut } from "./use-session";

export function SignOutButton() {
  const router = useRouter();
  const signOut = useSignOut();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sign out"
      title="Sign out"
      disabled={signOut.isPending}
      onClick={() =>
        signOut.mutate(undefined, {
          onSuccess: () => router.replace("/login"),
          onError: (error) => toast.error("Could not sign out", { description: error.message }),
        })
      }
    >
      <LogOutIcon aria-hidden />
    </Button>
  );
}
