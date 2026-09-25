import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { Wizard } from "@/features/wizard/wizard";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Event Package Builder</h1>
          <p className="text-muted-foreground">
            Pick an event template, adjust the suggested package, and create a draft proposal in
            Proposales.
          </p>
        </div>
        <div className="flex gap-1">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <Wizard />
    </main>
  );
}
