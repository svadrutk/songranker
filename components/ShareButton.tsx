"use client";

import { useState, type JSX } from "react";
import { Share2, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import type { SessionSong } from "@/lib/api";

type ShareButtonProps = {
  songs: SessionSong[];
};

export function ShareButton({ songs }: ShareButtonProps): JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    // Generate metadata
    const now = new Date();
    const seed = songs.length > 0 ? songs[0].song_id.length : 1234;
    const orderId = Math.floor((Math.sin(seed) * 0.5 + 0.5) * 9000) + 1000;
    const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    try {
      const response = await fetch('/api/generate-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songs: songs,
          orderId,
          dateStr,
          timeStr,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const blob = await response.blob();
      const file = new File([blob], "song-ranker-top-10.png", { type: "image/png" });

      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#ffffff"],
      });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Top 10 Songs",
          text: "My definitive rankings from SongRanker.app",
        });
      } else {
        const link = document.createElement("a");
        link.download = "song-ranker-top-10.png";
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (error) {
      console.error("Failed to generate share image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isGenerating}
      className="px-8 md:px-12 py-5 md:py-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-widest text-[10px] md:text-xs font-black group relative overflow-hidden"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Share2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
      )}
      {isGenerating ? "Exporting..." : "Export Rankings"}
      
      {!isGenerating && (
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </Button>
  );
}
