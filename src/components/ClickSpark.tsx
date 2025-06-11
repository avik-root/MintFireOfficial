"use client";

import React, { useRef, useEffect, useCallback, type RefObject } from "react";

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  extraScale?: number;
  children?: React.ReactNode;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  sparkColor = "#fff", // Default color
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1.0,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const animationFrameIdRef = useRef<number | null>(null); // Renamed to avoid conflict with startTimeRef if it existed

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let resizeTimeout: NodeJS.Timeout;

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(parent);

    resizeCanvas(); // Initial resize

    return () => {
      ro.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, []);

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case "linear":
          return t;
        case "ease-in":
          return t * t;
        case "ease-in-out":
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default: // ease-out
          return t * (2 - t);
      }
    },
    [easing]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark: Spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) {
          return false; // Remove spark if duration is over
        }

        const progress = elapsed / duration;
        const easedProgress = easeFunc(progress);

        const currentRadius = sparkRadius * easedProgress * extraScale;
        const currentSize = sparkSize * (1 - easedProgress); // Sparks shrink as they move out

        // Calculate start and end points of the spark line
        const x1 = spark.x + currentRadius * Math.cos(spark.angle);
        const y1 = spark.y + currentRadius * Math.sin(spark.angle);
        const x2 = spark.x + (currentRadius + currentSize) * Math.cos(spark.angle);
        const y2 = spark.y + (currentRadius + currentSize) * Math.sin(spark.angle);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = Math.max(1, currentSize / 5); // Adjust line width based on size, min 1
        ctx.stroke();

        return true;
      });

      if (sparksRef.current.length > 0) {
        animationFrameIdRef.current = requestAnimationFrame(draw);
      } else {
        // Clear canvas if no sparks to draw, to avoid lingering last frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationFrameIdRef.current = null; 
      }
    };

    // Start animation only if there are sparks
    if (sparksRef.current.length > 0 && !animationFrameIdRef.current) {
       animationFrameIdRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [sparkColor, sparkSize, sparkRadius, duration, easeFunc, extraScale]); // Removed sparkCount as it's only for generation

  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = performance.now();
    const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / sparkCount,
      startTime: now,
    }));

    sparksRef.current.push(...newSparks);

    // If animation loop isn't running, start it
    if (!animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame((timestamp) => {
            // The draw function inside useEffect will take over
            // This just ensures it starts if it was idle
        });
    }
  };

  return (
    <div className="relative w-full h-full" onClick={handleClick}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50" // Ensure canvas is on top for visibility but non-interactive
      />
      {children}
    </div>
  );
};

export default ClickSpark;
