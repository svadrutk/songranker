"use client";

import { useState, useCallback, type JSX } from "react";
import { SessionBuilder } from "@/components/SessionBuilder";
import { RankingWidget } from "@/components/RankingWidget";
import { AnalyticsPage } from "@/components/AnalyticsPage";
import { MyRankingsOverview } from "@/components/MyRankingsOverview";
import { createSession, type SongInput } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { DeduplicationModal } from "@/components/DeduplicationModal";
import {
  type DuplicateGroup,
} from "@/lib/deduplication";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { useNavigationStore } from "@/lib/store";

export default function Home(): JSX.Element {
  const { user } = useAuth();
  
  // Zustand store for navigation state
  const {
    view,
    sessionId,
    openInResultsView,
    setView,
    navigateToCreate,
    navigateToRanking,
    navigateBackFromResults,
  } = useNavigationStore();
  
  // Local state for ranking workflow
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [finalSongList, setFinalSongList] = useState<string[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRankingSession = useCallback(
    async (songs: SongInput[]) => {
      setIsCreatingSession(true);
      setError(null);

      try {
        const session = await createSession({
          user_id: user?.id,
          songs,
        });
        
        // Clear sessions cache
        if (user?.id) {
          localStorage.removeItem(`sr_sessions_${user.id}`);
        }
        
        navigateToRanking(session.session_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize ranking session");
      } finally {
        setIsCreatingSession(false);
      }
    },
    [user?.id, navigateToRanking]
  );

  const handleConfirmDeduplication = useCallback(
    async (songs: string[]) => {
      // Deduplication handling will be moved to SessionBuilder in later phases
    },
    []
  );

  const handleSessionDelete = useCallback((id: string) => {
    if (view === "ranking" && sessionId === id) {
      navigateToCreate();
    }
  }, [view, sessionId, navigateToCreate]);

  return (
    <div key={user?.id || "guest"} className="flex h-full w-full overflow-hidden bg-background relative">
      {/* Main Content — now always full space */}
      <main
        className="flex-1 min-h-0 h-full overflow-hidden bg-linear-to-br from-background via-background to-primary/5 relative"
      >
        <AnimatePresence>
          {isCreatingSession && <LoadingOverlay />}
          {error && (
            <ErrorOverlay
              error={error}
              onDismiss={() => setError(null)}
              onRetry={() => {}} // Retry logic in SessionBuilder
            />
          )}
        </AnimatePresence>
        
        {view === "create" ? (
          <SessionBuilder />
        ) : view === "analytics" ? (
          <div className="flex flex-col min-h-0 h-full w-full overflow-hidden px-4 md:px-8">
            <AnalyticsPage isSidebarCollapsed={true} />
          </div>
        ) : view === "my_rankings" && user ? (
          <div className="flex flex-col min-h-0 h-full w-full py-4 md:py-8 overflow-y-auto px-4 md:px-8">
            <MyRankingsOverview isSidebarCollapsed={true} onSessionDelete={handleSessionDelete} />
          </div>
        ) : (
          <RankingWidget
            isRanking={view === "ranking"}
            sessionId={sessionId}
            openInResultsView={openInResultsView}
            onBackFromResults={navigateBackFromResults}
          />
        )}
      </main>

      <DeduplicationModal
        isOpen={view === "review"}
        onClose={() => setView("create")}
        onConfirm={handleConfirmDeduplication}
        duplicateGroups={duplicateGroups}
        allSongs={finalSongList}
      />
    </div>
  );
}

function LoadingOverlay(): JSX.Element {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold font-mono uppercase tracking-tight">
          Initializing Session
        </h3>
        <p className="text-xs text-muted-foreground font-mono">
          Setting up your ranking environment...
        </p>
      </div>
    </div>
  );
}

type ErrorOverlayProps = Readonly<{
  error: string;
  onDismiss: () => void;
  onRetry: () => void;
}>;

function ErrorOverlay({
  error,
  onDismiss,
  onRetry,
}: ErrorOverlayProps): JSX.Element {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300 p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold font-mono uppercase tracking-tight text-destructive">
          Initialization Failed
        </h3>
        <p className="text-sm text-muted-foreground font-mono">{error}</p>
      </div>
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onDismiss}
          className="font-mono uppercase tracking-widest text-xs py-6 px-8"
        >
          Go Back
        </Button>
        <Button
          onClick={onRetry}
          className="bg-primary text-primary-foreground font-mono uppercase tracking-widest text-xs py-6 px-8"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
