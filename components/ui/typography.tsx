import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Each tag has a look of its own; size, weight and color change one part of it.
const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "text-3xl font-semibold tracking-tight",
      h2: "text-xl font-semibold tracking-tight",
      h3: "text-base font-medium",
      h4: "text-sm font-medium",
      p: "text-base",
      span: "",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    // Only the text colors of the theme in app/globals.css, so light and dark mode keep working.
    color: {
      foreground: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      secondary: "text-secondary-foreground",
      accent: "text-accent-foreground",
      destructive: "text-destructive",
      card: "text-card-foreground",
      popover: "text-popover-foreground",
      "on-primary": "text-primary-foreground",
    },
  },
})

type TypographyTag = "h1" | "h2" | "h3" | "h4" | "p" | "span"

type TypographyStyle = VariantProps<typeof typographyVariants>

// The variant defaults to the tag's own. Size, weight and color come after it,
// and the caller's className last, so each later class wins over an earlier one.
function typographyClassName({
  tag,
  variant,
  size,
  weight,
  color,
  className,
}: TypographyStyle & { tag: TypographyTag; className?: string }) {
  return cn(typographyVariants({ variant: variant ?? tag, size, weight, color }), className)
}

// The native color attribute is left out, so color always means a theme color.
type TypographyProps<Tag extends TypographyTag> = { as?: Tag } & TypographyStyle &
  Omit<React.ComponentProps<Tag>, "color">

function Typography<Tag extends TypographyTag = "p">({
  as,
  variant,
  size,
  weight,
  color,
  className,
  ...props
}: TypographyProps<Tag>) {
  const tag = as ?? "p"
  const Component = tag as React.ElementType
  return (
    <Component
      data-slot="typography"
      className={typographyClassName({ tag, variant, size, weight, color, className })}
      {...props}
    />
  )
}

export { Typography, typographyClassName, typographyVariants }
