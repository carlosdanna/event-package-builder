"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/features/wizard/steps/field";
import { useSignIn } from "./use-session";

export function LoginForm() {
  const router = useRouter();
  const signIn = useSignIn();
  const [password, setPassword] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signIn.isPending) return;
    signIn.mutate(
      { password },
      {
        onSuccess: () => {
          router.replace("/");
          router.refresh();
        },
      },
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold tracking-tight">Event Package Builder</h1>
        </CardTitle>
        <CardDescription>Enter the team password to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field id="password" label="Password" error={signIn.error?.message}>
            {(describedBy) => (
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (signIn.isError) signIn.reset();
                }}
                aria-invalid={signIn.isError || undefined}
                aria-describedby={describedBy}
                className="max-sm:h-11"
              />
            )}
          </Field>
          <Button type="submit" disabled={signIn.isPending || password === ""}>
            {signIn.isPending && <LoaderCircleIcon aria-hidden className="animate-spin" />}
            {signIn.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
