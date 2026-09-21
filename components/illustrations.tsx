import * as React from "react"
import { cn } from "@/lib/utils"

export interface IllustrationProps extends React.SVGProps<SVGSVGElement> {}

export function HeartHands({ className, ...props }: IllustrationProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="var(--color-foreground)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn("w-full h-full", className)} 
      {...props}
    >
      {/* Hand 1 */}
      <path d="M20 70 C 15 65, 10 70, 15 80 C 20 90, 40 95, 50 95" fill="var(--color-background)" />
      {/* Hand 2 */}
      <path d="M80 70 C 85 65, 90 70, 85 80 C 80 90, 60 95, 50 95" fill="var(--color-background)" />
      {/* Heart */}
      <path d="M50 40 C 50 40, 40 25, 25 35 C 10 45, 25 70, 50 85 C 75 70, 90 45, 75 35 C 60 25, 50 40, 50 40" fill="var(--color-secondary)" />
    </svg>
  )
}

export function CoinStack({ className, ...props }: IllustrationProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="var(--color-foreground)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn("w-full h-full", className)} 
      {...props}
    >
      <ellipse cx="50" cy="75" rx="30" ry="12" fill="var(--color-accent)" />
      <path d="M20 75 V 60 A 30 12 0 0 0 80 60 V 75" fill="var(--color-accent)" />
      <ellipse cx="50" cy="60" rx="30" ry="12" fill="var(--color-accent)" />
      <path d="M20 60 V 45 A 30 12 0 0 0 80 45 V 60" fill="var(--color-accent)" />
      <ellipse cx="50" cy="45" rx="30" ry="12" fill="var(--color-accent)" />
      <path d="M20 45 V 30 A 30 12 0 0 0 80 30 V 45" fill="var(--color-accent)" />
      <ellipse cx="50" cy="30" rx="30" ry="12" fill="var(--color-accent)" />
      
      {/* Sparkles */}
      <path d="M75 20 L 80 15 M 85 20 L 80 15 M 80 10 L 80 15 M 80 15 L 80 20" strokeWidth="2" />
      <path d="M15 35 L 20 30 M 25 35 L 20 30 M 20 25 L 20 30 M 20 30 L 20 35" strokeWidth="2" />
    </svg>
  )
}

export function DrawMachine({ className, ...props }: IllustrationProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="var(--color-foreground)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn("w-full h-full", className)} 
      {...props}
    >
      {/* Base */}
      <path d="M25 85 L 75 85 L 80 95 L 20 95 Z" fill="var(--color-primary)" />
      {/* Machine body */}
      <circle cx="50" cy="45" r="35" fill="var(--color-background)" />
      
      {/* Balls */}
      <circle cx="35" cy="55" r="8" fill="var(--color-accent)" />
      <circle cx="50" cy="65" r="8" fill="var(--color-secondary)" />
      <circle cx="65" cy="50" r="8" fill="var(--color-success)" />
      <circle cx="45" cy="40" r="8" fill="var(--color-primary)" />
      <circle cx="55" cy="25" r="8" fill="var(--color-accent)" />
      
      {/* Chute */}
      <path d="M50 80 L 50 90 M 40 80 L 40 90 M 60 80 L 60 90" />
      <rect x="42" y="78" width="16" height="7" rx="3" fill="var(--color-success)" />
    </svg>
  )
}

export function NotepadScores({ className, ...props }: IllustrationProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="var(--color-foreground)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn("w-full h-full", className)} 
      {...props}
    >
      <rect x="25" y="15" width="50" height="70" rx="4" fill="var(--color-background)" />
      <path d="M25 25 L 75 25" strokeWidth="3" />
      
      {/* Score lines */}
      <path d="M35 40 L 45 40 M 60 40 L 65 40" />
      <path d="M35 55 L 45 55 M 60 55 L 65 55" />
      <path d="M35 70 L 45 70 M 60 70 L 65 70" />
      
      {/* Checkmarks / highlights */}
      <circle cx="62" cy="40" r="5" fill="var(--color-success)" />
      <circle cx="62" cy="55" r="5" fill="var(--color-accent)" />
      <circle cx="62" cy="70" r="5" fill="var(--color-secondary)" />
      
      {/* Pen */}
      <path d="M80 50 L 70 85 L 65 90 L 68 80 L 85 45 Z" fill="var(--color-primary)" />
    </svg>
  )
}

export function Ticket({ className, ...props }: IllustrationProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="var(--color-foreground)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn("w-full h-full", className)} 
      {...props}
    >
      <path d="M15 30 L 85 30 L 85 40 A 10 10 0 0 1 85 60 L 85 70 L 15 70 L 15 60 A 10 10 0 0 1 15 40 Z" fill="var(--color-secondary)" />
      <path d="M35 30 L 35 70" strokeDasharray="4 4" />
      
      {/* Star / symbol inside */}
      <path d="M60 40 L 63 47 L 70 48 L 65 53 L 66 60 L 60 56 L 54 60 L 55 53 L 50 48 L 57 47 Z" fill="var(--color-accent)" />
    </svg>
  )
}
