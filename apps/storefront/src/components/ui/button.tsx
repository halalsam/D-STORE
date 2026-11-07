import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export const buttonVariants = cva(
  [
    "pressable relative inline-flex shrink-0 items-center justify-center gap-2 rounded-pill whitespace-nowrap",
    "disabled:opacity-45 aria-disabled:opacity-45",
    "[&_svg]:size-[1.15em] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** Light fill. Buy now, Apply, Discover more. */
        primary: "bg-surface-inverse text-ink-inverse hover:bg-surface-inverse-hover",
        /** Surface with hairline. Add to bag, Remove all. */
        secondary: "bg-surface text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-muted",
        /** Muted fill. Menu pill, Size guide, secondary chips. */
        soft: "bg-surface-muted text-ink hover:bg-surface-strong",
        /** No fill until hover. Header icons, quick add. */
        ghost: "text-current hover:bg-current/8",
        /** Light pill on photography. */
        media: "bg-surface-inverse text-ink-inverse hover:bg-surface-inverse-hover",
        /** Frosted glass on photography. */
        glass: "material-dark text-ink-on-media shadow-glass hover:bg-navy-950/50",
        /** Text with an animated underline. "Shop now" on the hero. */
        underline:
          "rounded-none px-0 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-(--duration-slow) after:ease-ios hover:after:scale-x-50",
      },
      size: {
        sm: "h-8 px-4 type-body-sm",
        md: "h-10 px-5 type-body-sm",
        lg: "h-12 px-6 type-label",
        xl: "h-14 px-8 type-label",
        "icon-sm": "size-8",
        icon: "size-10",
        "icon-lg": "size-12",
      },
      block: { true: "w-full" },
    },
    compoundVariants: [{ variant: "underline", class: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "lg" },
  }
)

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="invisible contents">{children}</span>
          <span aria-hidden className="absolute inset-0 grid place-items-center">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          </span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}
