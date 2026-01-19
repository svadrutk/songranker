"use client";

import { useState, useEffect, useCallback, Fragment, useRef } from "react";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getSessionDetail, createComparison, type SessionSong } from "@/lib/api";
import { getNextPair } from "@/lib/pairing";
import { calculateNewRatings } from "@/lib/elo";
import { Music, LogIn, Loader2, Trophy, Scale, RotateCcw, Check } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { RankingCard } from "@/components/RankingCard";
import { CoverArt } from "@/components/CoverArt";

type RankingWidgetProps = Readonly<{
  isRanking?: boolean;
  sessionId?: string | null;
}>;

export function RankingWidget({
  isRanking,
  sessionId,
}: RankingWidgetProps): JSX.Element {
  const { user, openAuthModal } = useAuth();
  const isMounted = useRef(true);
  const [songs, setSongs] = useState<SessionSong[]>([]);
  const [currentPair, setCurrentPair] = useState<[SessionSong, SessionSong] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalDuels, setTotalDuels] = useState(0);
  const [convergence, setConvergence] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isTie, setIsTie] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // 1. Calculate optimistic progress based on duel count (covers at least the 40% quantity weight)
  // We make it move at least 1% per duel initially to show life
  const quantityTarget = Math.max(1, songs.length * 1.5);
  const quantityProgress = Math.min(100, (totalDuels / quantityTarget) * 100);
  const optimisticMin = Math.min(40, quantityProgress);

  // 2. Final display score (monotonic update)
  const displayScore = Math.max(convergence, optimisticMin);

  // Initial load of songs
  useEffect(() => {
    if (!isRanking || !sessionId) return;

    async function loadSongs(): Promise<void> {
      setIsLoading(true);
      try {
        const detail = await getSessionDetail(sessionId!);
        if (detail && isMounted.current) {
          setSongs(detail.songs);
          setTotalDuels(detail.comparison_count);
          setConvergence(detail.convergence_score ?? 0);
          setCurrentPair(getNextPair(detail.songs));
        }
      } catch (error) {
        console.error("Failed to load session songs:", error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }
    loadSongs();
  }, [isRanking, sessionId]);

  const handleChoice = useCallback(
    async (winner: SessionSong | null, tie: boolean = false) => {
      if (!currentPair || !sessionId || winnerId) return;

      const [songA, songB] = currentPair;
      const wId = winner?.song_id || null;

      // 1. Trigger Animation
      setWinnerId(wId);
      setIsTie(tie);

      // 2. Wait for animation to finish
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 3. Calculate new ratings
      const scoreA = tie ? 0.5 : wId === songA.song_id ? 1 : 0;
      const [newEloA, newEloB] = calculateNewRatings(songA.local_elo, songB.local_elo, scoreA);

      // 4. Update & Prepare next pair
      setSongs((prevSongs) => {
        const updated = prevSongs.map((s) => {
          if (s.song_id === songA.song_id) return { ...s, local_elo: newEloA };
          if (s.song_id === songB.song_id) return { ...s, local_elo: newEloB };
          return s;
        });

        setCurrentPair(getNextPair(updated));
        return updated;
      });

      setTotalDuels((prev) => prev + 1);
      setWinnerId(null);
      setIsTie(false);

      // 5. Sync with Backend
      try {
        const response = await createComparison(sessionId, {
          song_a_id: songA.song_id,
          song_b_id: songB.song_id,
          winner_id: wId,
          is_tie: tie,
        });

        if (response.success) {
          const newScore = response.convergence_score ?? 0;
          if (isMounted.current) {
            setConvergence(prev => Math.max(prev, newScore));
          }

          if (response.sync_queued) {
            // Background sync for Bradley-Terry updates
            const syncData = async () => {
              if (!isMounted.current) return;
              try {
                const detail = await getSessionDetail(sessionId);
                if (detail && isMounted.current) {
                  // Merge strategy: Update strengths but preserve local Elos for current pair
                  if (detail.songs && detail.songs.length > 0) {
                    setSongs(prevSongs => {
                      return detail.songs.map(backendSong => {
                        // If this song is in the current active duel, trust local Elo more
                        // since the backend might not have processed the latest choice yet
                        const isCurrent = currentPair.some(p => p.song_id === backendSong.song_id);
                        if (isCurrent) {
                          const local = prevSongs.find(s => s.song_id === backendSong.song_id);
                          return { ...backendSong, local_elo: local?.local_elo ?? backendSong.local_elo };
                        }
                        return backendSong;
                      });
                    });
                  }
                  
                  const detailScore = detail.convergence_score ?? 0;
                  setConvergence(prev => Math.max(prev, detailScore));
                  setTotalDuels(prev => Math.max(prev, detail.comparison_count));
                }
              } catch (error) {
                console.error("Background sync failed:", error);
              }
            };

            // Staggered syncs to catch worker updates
            setTimeout(syncData, 1000);
            setTimeout(syncData, 4000);
          }
        }
      } catch (error) {
        console.error("Failed to sync comparison:", error);
      }
    },
    [currentPair, sessionId, winnerId]
  );

  const handleSkip = useCallback((): void => {
    setCurrentPair(getNextPair(songs));
  }, [songs]);

  const getConvergenceLabel = (score: number) => {
    if (score < 30) return "Calibrating Rankings...";
    if (score < 60) return "Establishing Order...";
    if (score < 90) return "Stabilizing Top 10...";
    return "Top 10 Stable!";
  };

  if (!user) {
    return (
      <RankingPlaceholder
        title="Authentication Required"
        description="Sign in to search for artists, select albums, and start ranking your favorite tracks."
        icon={<LogIn className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
        buttonText="Sign In"
        onClick={() => openAuthModal("login")}
      />
    );
  }

  if (!isRanking || !sessionId) {
    return (
      <RankingPlaceholder
        title="Ready to Rank?"
        description="Select albums from the catalog to start ranking your favorite tracks."
        icon={<Music className="h-5 w-5" />}
        hideButton
      />
    );
  }

  if (isLoading && songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Loading Session Data...
        </p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <Leaderboard 
        songs={songs} 
        onContinue={() => setIsFinished(false)} 
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-700 w-full">
        {/* Header Section */}
        <div className="text-center space-y-4 relative">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-[2px] w-12 bg-primary/20 rounded-full" />
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] font-mono">
              {totalDuels === 0 ? "Initial Encounter" : `Duel #${totalDuels + 1}`}
            </p>
            <div className="h-[2px] w-12 bg-primary/20 rounded-full" />
          </div>

          <div className="relative inline-block">
            <SpeedLines side="left" />
            <h2 className="text-4xl font-black tracking-tighter uppercase italic px-4">
              Make Your Choice
            </h2>
            <SpeedLines side="right" />
          </div>

          <div className="flex items-center justify-center gap-8 text-[11px] font-mono text-muted-foreground/60 uppercase font-bold">
            <StatBadge 
              icon={<div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />} 
              label={`${songs.length} Tracks Pool`} 
            />
            <StatBadge 
              icon={<Trophy className="h-3.5 w-3.5 text-primary/60" />} 
              label={`${totalDuels} Decisions`} 
            />
          </div>
        </div>

        {/* Progress Section */}
        <div className="w-full max-w-2xl space-y-3 px-4">
          <div className="flex items-center justify-between px-1">
             <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary/60">
               {getConvergenceLabel(displayScore)}
             </p>
             <p className="text-[10px] font-mono font-bold text-muted-foreground/40">
               {Math.round(displayScore)}%
             </p>
          </div>
          <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden border border-primary/5">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${displayScore}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
          <AnimatePresence>
            {displayScore >= 90 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-center pt-2"
              >
                <Button 
                  onClick={() => setIsFinished(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono uppercase tracking-widest text-[11px] font-black py-4 px-8 rounded-xl group"
                >
                  <Check className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  View Results
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Duel Area */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full justify-center min-h-[32rem]">
          {!currentPair ? (
            <PairingLoader />
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full justify-center">
              {[0, 1].map((index) => (
                <Fragment key={index}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPair[index].song_id}
                      initial={{ opacity: 0, x: index === 0 ? -40 : 40, filter: "blur(12px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, x: index === 0 ? -40 : 40, filter: "blur(12px)" }}
                      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <RankingCard
                        song={currentPair[index]}
                        onClick={() => handleChoice(currentPair[index])}
                        isWinner={winnerId === currentPair[index].song_id}
                        disabled={!!winnerId || isTie}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {index === 0 && (
                    <div className="flex flex-col gap-6 items-center shrink-0">
                      <div className="relative">
                        {/* Simple Emphasized VS Circle */}
                        <div className="h-16 w-16 rounded-full border-[3px] border-primary flex items-center justify-center bg-background shadow-lg relative z-10">
                          <span className="text-lg font-mono font-black text-primary select-none">
                            VS
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <RankingControlButton
                          icon={<Scale />}
                          label="Tie"
                          onClick={() => handleChoice(null, true)}
                          disabled={!!winnerId || isTie}
                        />
                        <RankingControlButton
                          icon={<RotateCcw />}
                          label="Skip"
                          onClick={handleSkip}
                          disabled={!!winnerId || isTie}
                        />
                      </div>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Footer/Progress Status */}
        <div className="flex items-center gap-3 mt-4">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-[0.4em] font-bold">
            Session Live • {totalDuels} Decisions • {Math.round(displayScore)}% Stable
          </p>
        </div>
      </div>
    </div>
  );
}

type SpeedLinesProps = Readonly<{
  side: "left" | "right";
}>;

function SpeedLines({ side }: SpeedLinesProps): JSX.Element {
  const isLeft = side === "left";
  return (
    <div 
      className={cn(
        "absolute top-0 bottom-0 flex flex-col justify-center gap-2 pointer-events-none",
        isLeft ? "-left-12" : "-right-12"
      )}
    >
      {[1, 2, 3].map((i) => (
        <motion.div
          key={`${side}-${i}`}
          className={cn("h-[2px] bg-primary/40 rounded-full", !isLeft && "ml-auto")}
          animate={{
            width: isLeft ? [10, 30, 15, 25] : [15, 25, 10, 30],
            opacity: isLeft ? [0.2, 0.8, 0.4] : [0.4, 0.2, 0.8],
            x: isLeft ? [0, -4, 2, 0] : [0, 4, -2, 0],
          }}
          transition={{
            duration: (isLeft ? 0.15 : 0.2) + i * 0.05,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

type StatBadgeProps = Readonly<{
  icon: React.ReactNode;
  label: string;
}>;

function StatBadge({ icon, label }: StatBadgeProps): JSX.Element {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border/40 bg-muted/10 backdrop-blur-sm">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function PairingLoader(): JSX.Element {
  return (
    <div className="h-[28rem] w-full max-w-4xl flex flex-col items-center justify-center gap-6 rounded-[2.5rem] border-2 border-dashed border-primary/10 bg-primary/[0.01]">
      <div className="h-16 w-16 rounded-full border-4 border-t-primary border-primary/10 animate-spin" />
      <div className="text-center space-y-2">
        <p className="text-[12px] font-mono uppercase tracking-[0.4em] text-primary/60 font-black">
          Optimizing Pairing Matrix
        </p>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-40">
          Selecting the most impactful encounter
        </p>
      </div>
    </div>
  );
}

type RankingPlaceholderProps = Readonly<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  buttonText?: string;
  onClick?: () => void;
  hideButton?: boolean;
}>;

function RankingPlaceholder({
  title,
  description,
  icon,
  buttonText,
  onClick,
  hideButton = false,
}: RankingPlaceholderProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8">
      <div className="flex flex-col items-center gap-12 w-full max-w-2xl text-center">
        <div className="flex items-center gap-6 opacity-20 grayscale pointer-events-none scale-90 select-none">
          <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
          <div className="flex flex-col gap-6">
            <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
            <div className="h-28 w-44 rounded-xl border-2 border-dashed border-primary/50" />
          </div>
          <div className="h-64 w-64 rounded-2xl border-2 border-dashed border-primary/50" />
        </div>
        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground font-mono max-w-sm">{description}</p>
          </div>
          {!hideButton && (
            <Button
              onClick={onClick}
              className="px-12 py-6 rounded-xl font-bold uppercase text-lg group"
            >
              {icon}
              {buttonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

type RankingControlButtonProps = Readonly<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}>;

function RankingControlButton({
  icon,
  label,
  onClick,
  disabled,
}: RankingControlButtonProps): JSX.Element {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-14 w-36 rounded-2xl border-border/40 hover:border-primary/50 transition-all bg-muted/10 hover:bg-primary/5 group shadow-sm hover:shadow-primary/5"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
        <span className="text-xs font-mono uppercase tracking-widest font-black">{label}</span>
      </div>
    </Button>
  );
}

type LeaderboardProps = {
  songs: SessionSong[];
  onContinue: () => void;
};

function Leaderboard({ songs, onContinue }: LeaderboardProps): JSX.Element {
  const sortedSongs = [...songs].sort((a, b) => {
    const scoreA = a.bt_strength ?? (a.local_elo / 3000); // Scale Elo to a similar range as BT strength roughly
    const scoreB = b.bt_strength ?? (b.local_elo / 3000);
    return scoreB - scoreA;
  });

  return (
    <div className="flex flex-col items-center justify-start h-full w-full gap-8 max-w-4xl mx-auto py-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="h-[2px] w-12 bg-primary/20 rounded-full" />
          <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] font-mono">
            Session Results
          </p>
          <div className="h-[2px] w-12 bg-primary/20 rounded-full" />
        </div>
        <h2 className="text-4xl font-black tracking-tighter uppercase italic">
          The Definitive Order
        </h2>
      </div>

      <div className="w-full space-y-2">
        {sortedSongs.map((song, index) => (
          <motion.div
            key={song.song_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/10 border border-border/40 hover:border-primary/20 transition-colors group"
          >
            <div className="w-8 text-2xl font-black font-mono text-primary/40 italic group-hover:text-primary transition-colors">
              #{index + 1}
            </div>
            <div className="h-12 w-12 shrink-0">
              <CoverArt
                title={song.name}
                url={song.cover_url}
                spotifyId={song.spotify_id}
                className="h-12 w-12 rounded-lg object-cover shadow-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate text-sm uppercase tracking-tight">{song.name}</h3>
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase truncate">
                {song.artist} • {song.album}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[10px] font-mono font-black text-primary uppercase tracking-widest">
                {Math.round((song.bt_strength || 0) * 100)} Strength
              </div>
              <div className="text-[9px] font-mono text-muted-foreground/40 uppercase">
                {song.local_elo} ELO
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-8 flex gap-4">
        <Button
          onClick={onContinue}
          variant="outline"
          className="px-12 py-6 rounded-xl font-mono uppercase tracking-widest text-xs font-black"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Keep Ranking
        </Button>
      </div>
    </div>
  );
}
