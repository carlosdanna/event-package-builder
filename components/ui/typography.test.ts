import { describe, expect, it } from "vitest";
import { typographyClassName } from "./typography";

function classes(options: Parameters<typeof typographyClassName>[0]) {
  return typographyClassName(options).split(" ");
}

describe("typographyClassName", () => {
  it("uses the tag's own variant by default", () => {
    expect(classes({ tag: "h1" })).toEqual(["text-3xl", "font-semibold", "tracking-tight"]);
    expect(classes({ tag: "h4" })).toEqual(["text-sm", "font-medium"]);
    expect(typographyClassName({ tag: "span" })).toBe("");
  });

  it("lets the variant differ from the tag", () => {
    expect(classes({ tag: "h3", variant: "h1" })).toEqual(classes({ tag: "h1" }));
  });

  it("replaces the variant's size and weight", () => {
    const result = classes({ tag: "h2", size: "sm", weight: "medium" });
    expect(result).toContain("text-sm");
    expect(result).toContain("font-medium");
    expect(result).toContain("tracking-tight");
    expect(result).not.toContain("text-xl");
    expect(result).not.toContain("font-semibold");
  });

  it("adds a theme color without dropping the size", () => {
    const result = classes({ tag: "p", size: "sm", color: "muted" });
    expect(result).toEqual(["text-sm", "text-muted-foreground"]);
  });

  it.each([
    ["foreground", "text-foreground"],
    ["muted", "text-muted-foreground"],
    ["primary", "text-primary"],
    ["secondary", "text-secondary-foreground"],
    ["accent", "text-accent-foreground"],
    ["destructive", "text-destructive"],
    ["card", "text-card-foreground"],
    ["popover", "text-popover-foreground"],
    ["on-primary", "text-primary-foreground"],
  ] as const)("maps the %s color to %s", (color, className) => {
    expect(classes({ tag: "span", color })).toEqual([className]);
  });

  it("adds no color when none is given, so the text inherits it", () => {
    expect(classes({ tag: "p" })).toEqual(["text-base"]);
  });

  it("keeps the caller's classes, which win over the variant", () => {
    const result = classes({ tag: "h2", className: "outline-none text-2xl" });
    expect(result).toContain("outline-none");
    expect(result).toContain("text-2xl");
    expect(result).not.toContain("text-xl");
  });
});
