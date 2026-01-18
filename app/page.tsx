"use client";

import { useState } from "react";
import { Catalog } from "@/components/Catalog";
import { RankingWidget } from "@/components/RankingWidget";
import { type ReleaseGroup } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user } = useAuth();
  const [selectedReleases, setSelectedReleases] = useState<ReleaseGroup[]>([]);
  const [allTracks, setAllTracks] = useState<Record<string, string[]>>({});

  const handleToggle = (release: ReleaseGroup, tracks: string[]) => {
    setSelectedReleases(prev => {
      const isSelected = prev.some(r => r.id === release.id);
      if (isSelected && tracks.length === 0) {
        // Remove
        return prev.filter(r => r.id !== release.id);
      } else if (isSelected) {
        // Update tracks if they weren't there before
        setAllTracks(t => ({ ...t, [release.id]: tracks }));
        return prev;
      } else {
        // Add
        setAllTracks(t => ({ ...t, [release.id]: tracks }));
        return [...prev, release];
      }
    });
  };

  const handleSearchStart = () => {
    setSelectedReleases([]);
    setAllTracks({});
  };

  return (
    <div key={user?.id || "guest"} className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Panel: Catalog */}
      <div className="w-1/3 min-w-[320px] max-w-md border-r bg-muted/10 p-6 flex flex-col h-full">
        <Catalog 
          onToggle={handleToggle} 
          onSearchStart={handleSearchStart}
          selectedIds={selectedReleases.map(r => r.id)} 
        />
      </div>

      {/* Right Panel: Ranking */}
      <div className="flex-1 h-full p-8 overflow-hidden bg-linear-to-br from-background via-background to-primary/5">
        <RankingWidget 
          selectedReleases={selectedReleases} 
          allTracks={allTracks}
        />
      </div>
    </div>
  );
}
