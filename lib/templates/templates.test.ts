import { describe, expect, it } from "vitest";
import { catalogMetadata } from "@/lib/catalog";
import { getTemplate, templates } from "./index";

describe("templates", () => {
  it("holds the five templates with unique ids", () => {
    const ids = templates.map((template) => template.id);

    expect(ids).toEqual(["conference", "wedding", "offsite", "private-dinner", "product-launch"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("refers only to titles that exist in the catalog", () => {
    for (const template of templates) {
      for (const item of template.items) {
        if (item.kind === "item") expect(catalogMetadata).toHaveProperty([item.title]);
      }
      if (template.rooms.kind === "per_guests") {
        expect(catalogMetadata[template.rooms.title]?.category).toBe("rooms");
      }
    }
  });

  it("sizes the meeting space only for conference, offsite and private dinner", () => {
    const bySize = templates
      .filter((template) => template.items.some((item) => item.kind === "meeting_space_by_size"))
      .map((template) => template.id);

    expect(bySize).toEqual(["conference", "offsite", "private-dinner"]);
  });

  it("books rooms per guests for wedding, offsite and product launch", () => {
    const guestsPerRoom = Object.fromEntries(
      templates.map((template) => [
        template.id,
        template.rooms.kind === "per_guests" ? template.rooms.guestsPerRoom : null,
      ]),
    );

    expect(guestsPerRoom).toEqual({
      conference: null,
      wedding: 8,
      offsite: 1,
      "private-dinner": null,
      "product-launch": 10,
    });
  });

  it("finds a template by id, or returns null", () => {
    expect(getTemplate("wedding")?.name).toBe("Wedding");
    expect(getTemplate("birthday")).toBeNull();
  });
});
