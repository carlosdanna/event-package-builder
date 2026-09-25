// Zod schemas for event templates. Safe to import in the browser.
import { z } from "zod";

// A template item is either a fixed catalog title or the smallest meeting space that fits.
export const templateItemSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("item"), title: z.string().min(1) }),
  z.object({ kind: z.literal("meeting_space_by_size") }),
]);
export type TemplateItem = z.infer<typeof templateItemSchema>;

// How many rooms a template books: none, or one room per so many guests, rounded up.
export const roomsRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({
    kind: z.literal("per_guests"),
    title: z.string().min(1),
    guestsPerRoom: z.number().int().positive(),
  }),
]);
export type RoomsRule = z.infer<typeof roomsRuleSchema>;

// Icon names from lucide-react; the interface maps each name to its component.
export const templateIconSchema = z.enum([
  "Presentation",
  "Heart",
  "Mountain",
  "UtensilsCrossed",
  "Rocket",
]);
export type TemplateIcon = z.infer<typeof templateIconSchema>;

export const templateIdSchema = z.enum([
  "conference",
  "wedding",
  "offsite",
  "private-dinner",
  "product-launch",
]);
export type TemplateId = z.infer<typeof templateIdSchema>;

export const templateSchema = z.object({
  id: templateIdSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  icon: templateIconSchema,
  eventType: z.string().min(1),
  items: z.array(templateItemSchema).min(1),
  rooms: roomsRuleSchema,
});
export type Template = z.infer<typeof templateSchema>;
