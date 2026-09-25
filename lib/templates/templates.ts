// The five event templates. Items refer to catalog content by its English title.
import { z } from "zod";
import { templateSchema, type Template } from "./schema";

const bySize = { kind: "meeting_space_by_size" } as const;
const item = (title: string) => ({ kind: "item", title }) as const;
const noRooms = { kind: "none" } as const;
const standardDoublePer = (guestsPerRoom: number) =>
  ({ kind: "per_guests", title: "Standard double", guestsPerRoom }) as const;

export const templates: Template[] = z.array(templateSchema).parse([
  {
    id: "conference",
    name: "Full-day conference",
    description: "A day of sessions with coffee breaks, lunch and a projector.",
    icon: "Presentation",
    eventType: "conference",
    items: [bySize, item("Coffee break"), item("Conference lunch"), item("Projector and screen")],
    rooms: noRooms,
  },
  {
    id: "wedding",
    name: "Wedding",
    description: "Dinner and celebration in the Grand Hall, with rooms for guests.",
    icon: "Heart",
    eventType: "wedding",
    items: [item("Grand Hall"), item("Wedding dinner package"), item("Microphone set")],
    rooms: standardDoublePer(8),
  },
  {
    id: "offsite",
    name: "Team offsite",
    description: "Work sessions, lunch and dinner, with a room for every guest.",
    icon: "Mountain",
    eventType: "offsite",
    items: [bySize, item("Conference lunch"), item("Three-course dinner")],
    rooms: standardDoublePer(1),
  },
  {
    id: "private-dinner",
    name: "Private dinner",
    description: "A three-course dinner in a private room sized for the group.",
    icon: "UtensilsCrossed",
    eventType: "dinner",
    items: [bySize, item("Three-course dinner")],
    rooms: noRooms,
  },
  {
    id: "product-launch",
    name: "Product launch",
    description: "A launch in the Grand Hall with screen, microphones and coffee.",
    icon: "Rocket",
    eventType: "product_launch",
    items: [
      item("Grand Hall"),
      item("Coffee break"),
      item("Projector and screen"),
      item("Microphone set"),
    ],
    rooms: standardDoublePer(10),
  },
]);

export function getTemplate(id: string) {
  return templates.find((template) => template.id === id) ?? null;
}
