import { Card, CardContent } from "@/components/ui/card";
import { ContentCount } from "./_components/content-count";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Event Package Builder
        </h1>
        <p className="text-muted-foreground">
          Pick an event template, adjust the suggested package, and create a
          draft proposal in Proposales.
        </p>
        <ContentCount />
      </header>

      <Card>
        <CardContent className="min-h-48" />
      </Card>
    </main>
  );
}
