// A failed call to Proposales. The message is safe to show in the interface.
export type ProposalesErrorKind =
  | "http" // Proposales answered with an error status
  | "timeout" // no answer within the time limit
  | "network" // the request never reached Proposales
  | "invalid_response" // the answer did not match the expected shape
  | "configuration"; // missing or invalid environment variables

export type ProposalesIssue = {
  code: string;
  path: (string | number)[];
  message: string;
};

export class ProposalesError extends Error {
  readonly kind: ProposalesErrorKind;
  readonly status?: number;
  readonly issues?: ProposalesIssue[];

  constructor(
    kind: ProposalesErrorKind,
    message: string,
    options: { status?: number; issues?: ProposalesIssue[]; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "ProposalesError";
    this.kind = kind;
    this.status = options.status;
    this.issues = options.issues;
  }
}
