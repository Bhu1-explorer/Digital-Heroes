"use client"

import { useEffect, useRef } from "react"

export function ForestBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    let animationFrameId: number
    let currentX = 0
    let currentY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY, view } = e
      if (!view) return
      const width = view.innerWidth
      const height = view.innerHeight
      
      // Calculate normalized mouse position (-1 to 1)
      targetX = (clientX / width) * 2 - 1
      targetY = (clientY / height) * 2 - 1
    }

    const animate = () => {
      // Smooth interpolation
      currentX += (targetX - currentX) * 0.05
      currentY += (targetY - currentY) * 0.05

      if (containerRef.current) {
        const layers = containerRef.current.querySelectorAll<SVGElement>("[data-depth]")
        layers.forEach((layer) => {
          const depth = parseFloat(layer.getAttribute("data-depth") || "0")
          const moveX = currentX * depth * -12 // max ~12px
          const moveY = currentY * depth * -6
          layer.style.transform = `translate(${moveX}px, ${moveY}px)`
        })
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    window.addEventListener("mousemove", handleMouseMove)
    animationFrameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div 
      className="fixed inset-0 -z-10 overflow-hidden bg-[#DCE5DD] pointer-events-none"
      ref={containerRef}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media (prefers-reduced-motion: no-preference) {
          .mist-band {
            animation: drift var(--duration, 60s) linear infinite;
          }
          .mist-band-2 {
            animation: drift-reverse var(--duration, 75s) linear infinite;
          }
          .pine-sway {
            transform-box: fill-box;
            transform-origin: bottom center;
            animation: sway var(--duration, 4s) ease-in-out infinite alternate var(--delay, 0s);
          }
        }
        @keyframes drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes drift-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes sway {
          0% { transform: rotate(-1.5deg); }
          100% { transform: rotate(1.5deg); }
        }
      `}} />
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-[200vw] sm:w-[150vw] md:w-full h-full object-cover min-w-[1200px]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <symbol id="pine" viewBox="0 0 100 200">
            <path d="M50 0 L100 80 L80 80 L100 140 L70 140 L90 200 L10 200 L30 140 L0 140 L20 80 L0 80 Z" />
          </symbol>
          <symbol id="bush" viewBox="0 0 100 100">
            <path d="M20 100 A 30 30 0 0 1 20 40 A 40 40 0 0 1 80 40 A 30 30 0 0 1 80 100 Z" />
          </symbol>
          
          <linearGradient id="hillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4E6553" />
            <stop offset="100%" stopColor="#7A8F7E" stopOpacity="0.4" />
          </linearGradient>
          
          <linearGradient id="mistGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B9C9BC" stopOpacity="0" />
            <stop offset="50%" stopColor="#B9C9BC" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#B9C9BC" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sky background */}
        <rect width="100%" height="100%" fill="#DCE5DD" />

        {/* (a) Mist bands */}
        <g data-depth="0.1">
          {/* Double width for seamless loop */}
          <g className="mist-band" style={{ '--duration': '80s' } as any}>
            <path d="M 0 200 Q 300 100 600 200 T 1200 200 Q 1500 100 1800 200 T 2400 200 L 2400 400 L 0 400 Z" fill="url(#mistGradient)" />
          </g>
          <g className="mist-band-2" style={{ '--duration': '100s' } as any}>
            <path d="M 0 350 Q 300 450 600 350 T 1200 350 Q 1500 450 1800 350 T 2400 350 L 2400 600 L 0 600 Z" fill="url(#mistGradient)" />
          </g>
        </g>

        {/* (b) Large rounded hill */}
        <g data-depth="0.2">
          <path d="M -200 800 L -200 300 Q 300 -100 900 800 Z" fill="url(#hillGradient)" />
        </g>

        {/* Mist overlay at hill base */}
        <g data-depth="0.25">
           <g className="mist-band" style={{ '--duration': '60s' } as any}>
            <path d="M 0 500 Q 300 400 600 500 T 1200 500 Q 1500 400 1800 500 T 2400 500 L 2400 800 L 0 800 Z" fill="url(#mistGradient)" />
          </g>
        </g>

        {/* (c) Distant pines */}
        <g data-depth="0.4" fill="#5F7A66">
          <use href="#pine" x="700" y="520" width="80" height="160" className="pine-sway" style={{ '--duration': '4s', '--delay': '0s' } as any} />
          <use href="#pine" x="780" y="590" width="60" height="120" className="pine-sway" style={{ '--duration': '5s', '--delay': '-1s' } as any} />
          <use href="#pine" x="840" y="600" width="100" height="200" className="pine-sway" style={{ '--duration': '4.5s', '--delay': '-2s' } as any} />
          <use href="#pine" x="980" y="650" width="70" height="140" className="pine-sway" style={{ '--duration': '3.8s', '--delay': '-0.5s' } as any} />
          <use href="#pine" x="1100" y="630" width="90" height="180" className="pine-sway" style={{ '--duration': '4.2s', '--delay': '-1.5s' } as any} />
          
          {/* A few on the left slope */}
          <use href="#pine" x="200" y="470" width="50" height="100" className="pine-sway" style={{ '--duration': '4s', '--delay': '0s' } as any} />
          <use href="#pine" x="280" y="580" width="70" height="140" className="pine-sway" style={{ '--duration': '5s', '--delay': '-1s' } as any} />
          <use href="#pine" x="380" y="680" width="90" height="180" className="pine-sway" style={{ '--duration': '4.2s', '--delay': '-2s' } as any} />
        </g>

        {/* (d) Mid-ground pines */}
        <g data-depth="0.7" fill="#2A4232">
          <use href="#pine" x="50" y="600" width="80" height="160" className="pine-sway" style={{ '--duration': '4.1s', '--delay': '-0.3s' } as any} />
          <use href="#pine" x="150" y="550" width="120" height="240" className="pine-sway" style={{ '--duration': '4.6s', '--delay': '-1.2s' } as any} />
          <use href="#pine" x="300" y="680" width="60" height="120" className="pine-sway" style={{ '--duration': '3.9s', '--delay': '-2.1s' } as any} />
          
          <use href="#pine" x="750" y="650" width="90" height="180" className="pine-sway" style={{ '--duration': '4.3s', '--delay': '-0.8s' } as any} />
          <use href="#pine" x="880" y="580" width="140" height="280" className="pine-sway" style={{ '--duration': '4.8s', '--delay': '-1.9s' } as any} />
          <use href="#pine" x="1050" y="620" width="110" height="220" className="pine-sway" style={{ '--duration': '4.4s', '--delay': '-0.4s' } as any} />
        </g>

        {/* (e) Foreground silhouettes */}
        <g data-depth="1.0">
          {/* Ground mounds */}
          <path d="M -100 800 L -100 750 Q 100 700 300 780 T 700 740 T 1300 760 L 1300 800 Z" fill="#3A3A22" />
          
          {/* Dark pines */}
          <g fill="#152119">
            <use href="#pine" x="-20" y="650" width="150" height="300" className="pine-sway" style={{ '--duration': '4.5s', '--delay': '0s' } as any} />
            <use href="#pine" x="400" y="700" width="100" height="200" className="pine-sway" style={{ '--duration': '4.2s', '--delay': '-1s' } as any} />
            <use href="#pine" x="950" y="650" width="180" height="360" className="pine-sway" style={{ '--duration': '5s', '--delay': '-2s' } as any} />
            <use href="#pine" x="1150" y="600" width="130" height="260" className="pine-sway" style={{ '--duration': '4.8s', '--delay': '-0.5s' } as any} />
          </g>

          {/* Bushes */}
          <g fill="#152119">
            <use href="#bush" x="100" y="720" width="100" height="100" />
            <use href="#bush" x="250" y="750" width="80" height="80" />
            <use href="#bush" x="500" y="740" width="120" height="120" />
            <use href="#bush" x="600" y="730" width="90" height="90" />
            <use href="#bush" x="800" y="760" width="70" height="70" />
          </g>
        </g>
      </svg>
    </div>
  )
}
