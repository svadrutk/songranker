"use client";

import { useState, useEffect, useCallback } from "react";
import type { JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitFeedback } from "@/lib/api";

type StarRatingNotificationProps = Readonly<{
  sessionId: string | null;
  isVisible: boolean;
  onDismiss: () => void;
}>;

const FEEDBACK_STORAGE_KEY = "songranker_feedback_sessions";

function getFeedbackSessions(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markSessionAsFeedbackGiven(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getFeedbackSessions();
    sessions.add(sessionId);
    // Keep only last 100 sessions to prevent localStorage bloat
    const sessionsArray = Array.from(sessions).slice(-100);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(sessionsArray));
  } catch {
    // Ignore storage errors
  }
}

export function hasGivenFeedback(sessionId: string): boolean {
  return getFeedbackSessions().has(sessionId);
}

export function StarRatingNotification({
  sessionId,
  isVisible,
  onDismiss,
}: StarRatingNotificationProps): JSX.Element {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleStarClick = useCallback(async (rating: number) => {
    if (!sessionId || isSubmitting || selectedRating !== null) return;
    
    setSelectedRating(rating);
    setIsSubmitting(true);
    
    try {
      await submitFeedback({
        message: `Star rating: ${rating}/5`,
        session_id: sessionId,
        star_rating: rating,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        url: typeof window !== "undefined" ? window.location.href : null,
      });
      
      markSessionAsFeedbackGiven(sessionId);
      setShowThankYou(true);
      
      // Auto-dismiss after showing thank you
      setTimeout(() => {
        onDismiss();
      }, 1500);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      // Still dismiss on error
      onDismiss();
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, isSubmitting, selectedRating, onDismiss]);

  // Reset state when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setHoveredStar(null);
      setSelectedRating(null);
      setShowThankYou(false);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed top-20 md:top-24 z-[200] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 max-w-[calc(100vw-2rem)]"
        >
          <div className="bg-background/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl p-4 md:p-5">
            {showThankYou ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-primary"
              >
                <Star className="h-5 w-5 fill-primary" />
                <span className="font-mono text-sm uppercase tracking-wide font-bold">
                  Thanks for the feedback!
                </span>
              </motion.div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="font-mono text-xs md:text-sm uppercase tracking-wide text-foreground/90 font-medium">
                    How was this ranking?
                  </p>
                  <button
                    onClick={onDismiss}
                    className="text-muted-foreground hover:text-foreground transition-colors -mt-1 -mr-1 p-1"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex gap-1 md:gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoveredStar !== null 
                      ? star <= hoveredStar 
                      : selectedRating !== null 
                        ? star <= selectedRating 
                        : false;
                    
                    return (
                      <button
                        key={star}
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        disabled={isSubmitting || selectedRating !== null}
                        className={cn(
                          "p-1 transition-all duration-150",
                          "hover:scale-110 active:scale-95",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        )}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={cn(
                            "h-7 w-7 md:h-8 md:w-8 transition-colors duration-150",
                            isFilled 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-muted-foreground/50 hover:text-yellow-400/70"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
