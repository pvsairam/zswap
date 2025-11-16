"use client";

import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { cn } from '@/lib/utils';

interface RoughBorderProps {
  children: React.ReactNode;
  className?: string;
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  fill?: boolean;
  fillStyle?: 'hachure' | 'solid' | 'zigzag' | 'cross-hatch' | 'dots' | 'dashed' | 'zigzag-line';
  strokeColor?: string;
  fillColor?: string;
  borderRadius?: number;
}

export function RoughBorder({
  children,
  className,
  strokeWidth = 2,
  roughness = 1.5,
  bowing = 1,
  fill = false,
  fillStyle = 'hachure',
  strokeColor = 'currentColor',
  fillColor,
  borderRadius = 12,
}: RoughBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = svgRef.current;
    const rc = rough.svg(svg);

    // Clear previous drawings
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const { width, height } = dimensions;
    const padding = strokeWidth * 2;

    // Draw rounded rectangle with rough style
    try {
      const node = rc.rectangle(padding, padding, width - padding * 2, height - padding * 2, {
        stroke: strokeColor,
        strokeWidth,
        roughness,
        bowing,
        fill: fill ? (fillColor || strokeColor) : undefined,
        fillStyle: fill ? fillStyle : undefined,
        fillWeight: strokeWidth * 0.5,
        hachureAngle: 60,
        hachureGap: 4,
        seed: Math.floor(width + height), // Deterministic based on size
      });

      svg.appendChild(node);
    } catch (error) {
      console.error('Error drawing rough border:', error);
    }
  }, [dimensions, strokeWidth, roughness, bowing, fill, fillStyle, strokeColor, fillColor, borderRadius]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// Preset variants for common use cases
export function RoughCard({ children, className, ...props }: RoughBorderProps) {
  return (
    <RoughBorder
      strokeWidth={3}
      roughness={2}
      bowing={2}
      className={cn("p-6", className)}
      {...props}
    >
      {children}
    </RoughBorder>
  );
}

export function RoughButton({ children, className, filled = true, ...props }: RoughBorderProps & { filled?: boolean }) {
  return (
    <RoughBorder
      strokeWidth={2.5}
      roughness={1.5}
      bowing={1.5}
      fill={filled}
      fillStyle="cross-hatch"
      className={cn("px-6 py-3 inline-flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </RoughBorder>
  );
}

export function RoughInput({ children, className, ...props }: RoughBorderProps) {
  return (
    <RoughBorder
      strokeWidth={2}
      roughness={1.2}
      bowing={0.8}
      className={cn("px-4 py-3", className)}
      {...props}
    >
      {children}
    </RoughBorder>
  );
}
