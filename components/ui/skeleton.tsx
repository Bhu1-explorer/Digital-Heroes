import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-xl bg-muted border-2 border-border/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
