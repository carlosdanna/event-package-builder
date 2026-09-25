// Stand-in for the customer and confirm steps, which are not built yet.
export function PlaceholderStep({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{message}</p>
  );
}
