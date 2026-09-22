import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        danger:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        info:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export function StatusBadge({ status, className, ...props }: { status: string } & React.HTMLAttributes<HTMLDivElement>) {
  const normalizedStatus = status.toLowerCase()
  let variant: "success" | "warning" | "danger" | "info" | "default" | "secondary" | "destructive" | "outline" = "secondary"

  switch (normalizedStatus) {
    case "active":
    case "approved":
    case "paid":
    case "completed":
      variant = "success"
      break
    case "pending":
    case "awaiting_proof":
    case "submitted":
      variant = "warning"
      break
    case "rejected":
    case "canceled":
    case "failed":
    case "past_due":
    case "inactive":
      variant = "danger"
      break
    default:
      variant = "secondary"
  }

  // Format status string for display (e.g., "awaiting_proof" -> "Awaiting Proof")
  const displayStatus = status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <Badge variant={variant} className={className} {...props}>
      {displayStatus}
    </Badge>
  )
}

export { Badge, badgeVariants }
