// Request and response bodies of this app's /api/session, shared by the route and the browser.
import { z } from "zod";

export const signInRequestSchema = z.strictObject({
  password: z.string().min(1, "Enter the password.").max(200),
});
export type SignInRequest = z.infer<typeof signInRequestSchema>;

export const sessionResponseSchema = z.object({ signedIn: z.boolean() });
