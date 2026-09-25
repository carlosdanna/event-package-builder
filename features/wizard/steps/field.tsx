// A labelled form field with an optional hint and error, wired up for screen readers.
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: (describedBy: string | undefined) => React.ReactNode;
};

export function Field({ id, label, hint, error, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label id={`${id}-label`} htmlFor={id}>
        {label}
      </Label>
      {children(describedBy)}
      {hint && (
        <Typography id={hintId} size="sm" color="muted">
          {hint}
        </Typography>
      )}
      {error && (
        <Typography id={errorId} size="sm" color="destructive">
          {error}
        </Typography>
      )}
    </div>
  );
}
