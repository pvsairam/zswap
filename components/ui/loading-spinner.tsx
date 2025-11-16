"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "gradient" | "dots";
  className?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  variant = "default",
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  if (variant === "gradient") {
    return (
      <motion.div
        className={cn("relative", sizeClasses[size], className)}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        data-testid="loading-spinner-gradient"
      >
        <div className="absolute inset-0 rounded-full bg-primary"></div>
        <div className="absolute inset-2 rounded-full bg-background"></div>
      </motion.div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-2", className)} data-testid="loading-dots">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "rounded-full bg-primary",
              size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
            )}
            animate={{
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <Loader2 
      className={cn(
        "animate-spin text-primary",
        sizeClasses[size],
        className
      )} 
      data-testid="loading-spinner-default"
    />
  );
}

interface LoadingCardProps {
  lines?: number;
  className?: string;
}

export function LoadingCard({ lines = 3, className }: LoadingCardProps) {
  return (
    <div className={cn("space-y-3", className)} data-testid="loading-card">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 skeleton w-3/4" style={{ animationDelay: `${i * 100}ms` }}></div>
          <div className="h-4 skeleton w-full" style={{ animationDelay: `${i * 100 + 50}ms` }}></div>
        </div>
      ))}
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message, className }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background",
        className
      )}
      data-testid="loading-overlay"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-4 p-8 rounded-2xl card-black"
      >
        <LoadingSpinner size="xl" variant="gradient" />
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-medium text-foreground"
            data-testid="text-loading-message"
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
