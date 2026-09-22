"use client"

import { useState } from "react"
import Image from "next/image"
import { HeartHands, CoinStack, DrawMachine, NotepadScores, Ticket } from "@/components/illustrations"

interface CharityImageProps {
  id: string
  name: string
  imageUrl: string | null
  className?: string
  iconClassName?: string
}

const ILLUSTRATIONS = [HeartHands, CoinStack, DrawMachine, NotepadScores, Ticket]

export function CharityImage({ id, name, imageUrl, className = "", iconClassName = "size-24 text-muted-foreground opacity-50" }: CharityImageProps) {
  const [imgError, setImgError] = useState(false)

  // Use simple hash of ID to pick a consistent illustration
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const Illustration = ILLUSTRATIONS[hash % ILLUSTRATIONS.length]

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-muted ${className}`}>
      {imageUrl && !imgError ? (
        <Image 
          src={imageUrl} 
          alt={name} 
          fill 
          className="object-cover" 
          onError={() => setImgError(true)}
        />
      ) : (
        <Illustration className={iconClassName} />
      )}
    </div>
  )
}
