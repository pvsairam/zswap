'use client';

import { useEffect, useRef, ReactNode } from 'react';
import rough from 'roughjs';

interface RoughBorderProps {
  children: ReactNode;
  className?: string;
  strokeWidth?: number;
  roughness?: number;
  fill?: boolean;
  fillStyle?: 'hachure' | 'solid' | 'zigzag' | 'cross-hatch' | 'dots' | 'dashed' | 'zigzag-line';
}

export function RoughBorder({ 
  children, 
  className = '',
  strokeWidth = 2,
  roughness = 1.5,
  fill = false,
  fillStyle = 'hachure'
}: RoughBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const rc = rough.canvas(canvas);

    const updateCanvas = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      // Set canvas size with device pixel ratio for crisp rendering
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Reset and apply transform for device pixel ratio
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Draw rough border
      const options = {
        roughness,
        strokeWidth,
        stroke: 'hsl(var(--border))',
        fill: fill ? 'hsl(var(--border) / 0.05)' : undefined,
        fillStyle,
      };

      // Draw rounded rectangle
      const radius = 12;
      rc.path(
        `M ${radius},0 
         L ${width - radius},0 
         Q ${width},0 ${width},${radius}
         L ${width},${height - radius}
         Q ${width},${height} ${width - radius},${height}
         L ${radius},${height}
         Q 0,${height} 0,${height - radius}
         L 0,${radius}
         Q 0,0 ${radius},0 Z`,
        options
      );
    };

    updateCanvas();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateCanvas);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [strokeWidth, roughness, fill, fillStyle]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
