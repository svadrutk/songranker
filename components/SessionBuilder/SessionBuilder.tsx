"use client";

import { type JSX } from "react";
import { useSessionBuilderStore } from "@/lib/store";

export function SessionBuilder(): JSX.Element {
  const { sources } = useSessionBuilderStore();

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-4 md:px-8 py-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-mono font-black uppercase tracking-tighter">
          Create Session
        </h1>
        <p className="text-muted-foreground font-mono text-sm md:text-base max-w-2xl mx-auto">
          Mix your favorite playlists and artists into a single ranking session.
        </p>
      </div>

      {/* Unified Search Bar Scaffold */}
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-muted/20 p-8 rounded-3xl border border-border/40 backdrop-blur-sm">
          <div className="h-14 w-full bg-background rounded-xl border border-border flex items-center px-6 text-muted-foreground font-mono text-lg shadow-sm">
            Paste link or search artist...
          </div>
        </div>
      </div>

      {/* Quick Start Tiles Scaffold */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-muted/10 p-8 rounded-3xl border border-border/40 hover:bg-muted/20 hover:border-primary/20 transition-all cursor-pointer group text-left flex flex-col gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="font-mono font-black text-xl">#</span>
          </div>
          <div>
            <h3 className="font-mono font-black uppercase tracking-widest text-primary mb-1">Playlist Link</h3>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">Paste a Spotify or Apple Music link to import tracks instantly.</p>
          </div>
        </button>
        <button className="bg-muted/10 p-8 rounded-3xl border border-border/40 hover:bg-muted/20 hover:border-primary/20 transition-all cursor-pointer group text-left flex flex-col gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="font-mono font-black text-xl">@</span>
          </div>
          <div>
            <h3 className="font-mono font-black uppercase tracking-widest text-primary mb-1">Search Artist</h3>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">Manually select albums and songs from any artist discography.</p>
          </div>
        </button>
        <button 
          disabled={sources.length === 0}
          className="bg-muted/10 p-8 rounded-3xl border border-border/40 hover:bg-muted/20 hover:border-primary/20 transition-all cursor-pointer group text-left flex flex-col gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="font-mono font-black text-xl">&gt;</span>
          </div>
          <div>
            <h3 className="font-mono font-black uppercase tracking-widest text-primary mb-1">Resume Draft</h3>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">Pick up where you left off with your current draft ({sources.length} sources).</p>
          </div>
        </button>
      </div>
    </div>
  );
}
