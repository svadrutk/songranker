"use client";

import { Button } from "@/components/ui/button";
import { type ReleaseGroup } from "@/lib/api";
import { Music, LogIn } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface RankingWidgetProps {
  selectedReleases: ReleaseGroup[];
  allTracks: Record<string, string[]>;
}

export function RankingWidget({ selectedReleases, allTracks }: RankingWidgetProps) {
  const { user, openAuthModal } = useAuth();
  const totalTracks = selectedReleases.reduce((sum, r) => sum + (allTracks[r.id]?.length || 0), 0);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8">
      {user && selectedReleases.length > 0 ? (
        <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Currently Ranking {selectedReleases.length} Release{selectedReleases.length > 1 ? "s" : ""}
            </p>
            <h2 className="text-xl font-mono font-bold truncate max-w-lg">
              {selectedReleases.length === 1 
                ? selectedReleases[0].title 
                : `${selectedReleases[0].title} + ${selectedReleases.length - 1} more`}
            </h2>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">
              {totalTracks} Total Tracks Loaded
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <Button variant="outline" className="h-64 w-64 rounded-2xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group" aria-label="Rank option 1">
              <div className="flex flex-col items-center gap-4 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Music className="h-12 w-12" />
                 <span className="text-xs font-mono uppercase tracking-widest font-bold">Song A</span>
              </div>
            </Button>
            
            <div className="flex flex-col gap-6">
              <Button variant="outline" className="h-28 w-44 rounded-xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group" aria-label="Rank option 2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-20 group-hover:opacity-100 transition-opacity">Option B</span>
              </Button>
              <Button variant="outline" className="h-28 w-44 rounded-xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group" aria-label="Rank option 3">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-20 group-hover:opacity-100 transition-opacity">Option C</span>
              </Button>
            </div>
            
            <Button variant="outline" className="h-64 w-64 rounded-2xl border-2 hover:border-primary/50 transition-all hover:bg-primary/5 group" aria-label="Rank option 4">
               <div className="flex flex-col items-center gap-4 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Music className="h-12 w-12" />
                 <span className="text-xs font-mono uppercase tracking-widest font-bold">Song D</span>
              </div>
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground font-mono animate-pulse">Select an option to rank</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-12 w-full max-w-2xl">
          {/* Outlined Placeholder */}
          <div className="flex items-center gap-6 opacity-40 grayscale pointer-events-none scale-90">
            <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
            <div className="flex flex-col gap-6">
              <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
              <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
            </div>
            <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
          </div>

          {/* Contextual Message */}
          {!user ? (
            <div className="flex flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold uppercase tracking-tight">Authentication Required</h2>
                <p className="text-sm text-muted-foreground font-mono max-w-sm">
                  Sign in to search for artists, select albums, and start ranking your favorite tracks.
                </p>
              </div>
              <Button 
                onClick={() => openAuthModal("login")}
                className="px-12 py-6 rounded-xl font-bold uppercase text-lg group"
              >
                <LogIn className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                Sign In
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center opacity-40">
               <Music className="h-8 w-8 mb-2 text-muted-foreground" />
               <p className="text-xs font-mono uppercase tracking-widest font-bold">Select albums from the catalog to start ranking</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
