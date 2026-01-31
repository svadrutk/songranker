"use client";

import { useState, type JSX } from "react";
import { Share2, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import type { SessionSong } from "@/lib/api";
import { generateShareImage } from "@/lib/share-actions";

type ShareButtonProps = {
  songs: SessionSong[];
};

export function ShareButton({ songs }: ShareButtonProps): JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (isGenerating) return;
    
    console.log('[ShareButton] Button clicked, starting generation...');
    setIsGenerating(true);

    try {
      console.log('[ShareButton] Preparing request data...');
      // Prepare data for backend
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      
      // Random order ID (or could be session ID based if we had it)
      const orderId = Math.floor(Math.random() * 9000) + 1000;

      console.log(`[ShareButton] Calling Server Action with ${songs.length} songs`);
      
      // Call Server Action instead of fetching directly
      const result = await generateShareImage(songs, orderId, dateStr, timeStr);

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('[ShareButton] Converting base64 to blob...');
      // Convert base64 back to blob
      const binaryString = atob(result.imageData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      console.log(`[ShareButton] Blob size: ${blob.size} bytes`);
      const file = new File([blob], "my-top-10.png", { type: "image/png" });

      // Trigger confetti
      console.log('[ShareButton] Triggering confetti...');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#ffffff"],
      });

      // Check for Web Share API
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Top 10 Songs",
          text: "Check out my definitive top 10 songs on Song Ranker!",
        });
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "my-top-10.png";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("[ShareButton] Failed to generate share image:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('[ShareButton] Finished, resetting state');
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isGenerating}
      className="w-full md:flex-1 h-12 font-mono uppercase tracking-wider text-xs md:text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white border border-blue-600 hover:border-blue-700 hover:cursor-pointer"
    >
      {isGenerating ? (
        <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin shrink-0" />
      ) : (
        <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 shrink-0" />
      )}
      <span className="truncate">{isGenerating ? "Generating..." : "Share Rankings"}</span>
    </Button>
  );
}
