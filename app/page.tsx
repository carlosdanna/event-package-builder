import { cookies } from "next/headers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Typography } from "@/components/ui/typography";
import { SessionExpiryDialog } from "@/features/auth/session-expiry-dialog";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { SESSION_COOKIE, sessionExpiresAt } from "@/lib/auth/session";
import { Wizard } from "@/features/wizard/wizard";

export default async function Home() {
  // proxy.ts only lets signed-in browsers through, so the expiry is known here.
  // If it ran out in between, the dialog opens straight away.
  const cookieStore = await cookies();
  const expiresAt = sessionExpiresAt(cookieStore.get(SESSION_COOKIE)?.value) ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Typography as="h1">Event Package Builder</Typography>
          <Typography color="muted">
            Pick an event template, adjust the suggested package, and create a draft proposal in
            Proposales.
          </Typography>
        </div>
        <div className="flex gap-1">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <Wizard />
      <SessionExpiryDialog expiresAt={expiresAt} />
    </main>
  );
}
