"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  type SessionSong, 
  getSessionSongs, 
  createComparison 
} from "@/lib/api";
import { getNextPair } from "@/lib/pairing";
import { calculateNewRatings } from "@/lib/elo";
import { Music, LogIn, Loader2, Trophy, Scale, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { RankingCard } from "@/components/RankingCard";

interface RankingWidgetProps {
  isRanking?: boolean;
  sessionId?: string | null;
}

export function RankingWidget({ 
  isRanking, 
  sessionId 
}: RankingWidgetProps) {
  const { user, openAuthModal } = useAuth();
  const [songs, setSongs] = useState<SessionSong[]>([]);
  const [currentPair, setCurrentPair] = useState<[SessionSong, SessionSong] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalDuels, setTotalDuels] = useState(0);

  // Initial load of songs
  useEffect(() => {
    if (isRanking && sessionId) {
      const loadSongs = async () => {
        setIsLoading(true);
        try {
          const fetchedSongs = await getSessionSongs(sessionId);
          setSongs(fetchedSongs);
          const firstPair = getNextPair(fetchedSongs);
          setCurrentPair(firstPair);
        } catch (error) {
          console.error("Failed to load session songs:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadSongs();
    }
  }, [isRanking, sessionId]);

  const handleChoice = useCallback(async (winner: SessionSong | null, isTie: boolean = false) => {
    if (!currentPair || !sessionId) return;

    const [songA, songB] = currentPair;
    const winnerId = winner?.song_id || null;

    // 1. Optimistic Update
    const scoreA = isTie ? 0.5 : (winnerId === songA.song_id ? 1 : 0);
    const [newEloA, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, scoreA);

    setSongs(prevSongs => prevSongs.map(s => {
      if (s.song_id === songA.song_id) return { ...s, local_elo: newEloA };
      if (s.song_id === songB.song_id) return { ...s, local_elo: newEloB };
      return s;
    }));

    setTotalDuels(prev => prev + 1);

    // 2. Prepare next pair immediately for snappy UI
    const updatedSongs = songs.map(s => {
      if (s.song_id === songA.song_id) return { ...s, local_elo: newEloA };
      if (s.song_id === songB.song_id) return { ...s, local_elo: newEloB };
      return s;
    });
    setCurrentPair(getNextPair(updatedSongs));

    // 3. Sync with Backend
    try {
      await createComparison(sessionId, {
        song_a_id: songA.song_id,
        song_b_id: songB.song_id,
        winner_id: winnerId,
        is_tie: isTie
      });
    } catch (error) {
      console.error("Failed to sync comparison:", error);
    }
  }, [currentPair, sessionId, songs]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-8">
        <div className="flex flex-col items-center gap-12 w-full max-w-2xl">
          <div className="flex items-center gap-6 opacity-40 grayscale pointer-events-none scale-90">
            <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
            <div className="flex flex-col gap-6">
              <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
              <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
            </div>
            <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
          </div>
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
        </div>
      </div>
    );
  }

  if (!isRanking || !sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-8">
        <div className="flex flex-col items-center gap-12 w-full max-w-2xl text-center">
          <div className="flex items-center gap-6 opacity-40 grayscale pointer-events-none scale-90">
            <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
            <div className="flex flex-col gap-6">
              <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
              <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
            </div>
            <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
          </div>
          <div className="flex flex-col items-center gap-2 opacity-40">
             <Music className="h-8 w-8 mb-2 text-muted-foreground" />
             <p className="text-xs font-mono uppercase tracking-widest font-bold">Select albums from the catalog to start ranking</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Loading Session Data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8">
      <div className="flex flex-col items-center gap-12 animate-in fade-in zoom-in duration-500">
        {/* Header Section */}
        <div className="text-center space-y-3 relative">
          <div className="flex items-center justify-center gap-3 mb-1">
             <div className="h-px w-8 bg-primary/20" />
             <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
               {totalDuels === 0 ? "Battle Phase" : `Duel Sequence #${totalDuels + 1}`}
             </p>
             <div className="h-px w-8 bg-primary/20" />
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Make Your Choice
          </h2>
          
          <div className="flex items-center justify-center gap-6 text-[10px] font-mono text-muted-foreground/60 uppercase">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/50 bg-muted/20">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <span>{songs.length} Tracks Pool</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/50 bg-muted/20">
              <Trophy className="h-3 w-3 text-primary/60" />
              <span>{totalDuels} Decisions Made</span>
            </div>
          </div>
        </div>
        
        {/* Duel Area */}
        <div className="flex items-center gap-8 lg:gap-16">
          {currentPair ? (
            <>
              <RankingCard 
                song={currentPair[0]} 
                onClick={() => handleChoice(currentPair[0])} 
              />
              
              <div className="flex flex-col gap-4 items-center">
                <div className="h-12 w-12 rounded-full border-2 border-primary/20 flex items-center justify-center bg-background/50 backdrop-blur-sm relative z-10 group">
                  <span className="text-xs font-mono font-bold text-primary/40 group-hover:text-primary transition-colors">VS</span>
                  <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping opacity-20" />
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleChoice(null, true)}
                    className="h-12 w-32 rounded-xl border-border/50 hover:border-primary/50 transition-all bg-muted/20 hover:bg-primary/5 group"
                  >
                    <div className="flex items-center gap-2">
                      <Scale className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Tie</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentPair(getNextPair(songs))}
                    className="h-12 w-32 rounded-xl border-border/50 hover:border-primary/50 transition-all bg-muted/20 hover:bg-primary/5 group"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Skip</span>
                    </div>
                  </Button>
                </div>
              </div>
              
              <RankingCard 
                song={currentPair[1]} 
                onClick={() => handleChoice(currentPair[1])} 
              />
            </>
          ) : (
            <div className="h-80 w-[40rem] flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-primary/10 bg-primary/[0.02]">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
                Recalibrating Pairing Matrix...
              </p>
            </div>
          )}
        </div>
        
        {/* Footer/Progress */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] text-muted-foreground/40 font-mono uppercase tracking-[0.3em] animate-pulse">
            Session active • Awaiting input
          </p>
        </div>
      </div>
    </div>
  );
}
