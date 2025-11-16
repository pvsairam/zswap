import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-border shadow-sketch hover:shadow-sketch-md hover:-translate-y-0.5 hover:-rotate-[0.5deg] active:translate-y-0.5 active:rotate-[0.3deg] active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive shadow-sketch hover:shadow-sketch-md hover:-translate-y-0.5 hover:rotate-[0.5deg]",
        outline:
          "border-border bg-transparent text-foreground hover:bg-muted shadow-sketch hover:shadow-sketch-md hover:-translate-y-0.5 hover:rotate-[0.3deg]",
        secondary:
          "bg-secondary text-secondary-foreground border-border shadow-sketch hover:shadow-sketch-md hover:-translate-y-0.5 hover:-rotate-[0.3deg]",
        ghost: "border-transparent hover:bg-accent/10 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline border-transparent",
        cyan: "bg-primary text-primary-foreground border-border shadow-sketch hover:shadow-sketch-md hover:-translate-y-0.5 hover:-rotate-[0.5deg]",
        primary: "bg-primary text-primary-foreground border-border shadow-sketch hover:shadow-sketch-md hover:-translate-y-0.5 hover:-rotate-[0.5deg]",
        success: "bg-success text-success-foreground border-success shadow-sketch hover:shadow-sketch-md hover:-translate-y-0.5 hover:rotate-[0.5deg]",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-10 rounded-lg px-3 text-xs",
        lg: "h-14 rounded-lg px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }