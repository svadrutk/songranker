"use client";

import { useState, useMemo, type JSX } from "react";
import { Plus, Check, X, Loader2 } from "lucide-react";
import type { ReleaseGroup } from "@/lib/api";
import { ReleaseFilters, type ReleaseType } from "@/components/Catalog/ReleaseFilters";
import { ReleaseItem } from "@/components/Catalog/ReleaseItem";
import { Button } from "@/components/ui/button";

type InlineArtistSelectorProps = Readonly<{
  artistName: string;
  releases: ReleaseGroup[];
  loading: boolean;
  onAdd: (selectedReleases: ReleaseGroup[]) => void;
  onCancel: () => void;
}>;

export function InlineArtistSelector({
  artistName,
  releases,
  loading,
  onAdd,
  onCancel,
}: InlineArtistSelectorProps): JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ReleaseType[]>(["Album"]);

  const toggleFilter = (type: ReleaseType) => {
    setActiveFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const filteredReleases = useMemo(() => {
    const activeFiltersLower = new Set(activeFilters.map((f) => f.toLowerCase()));
    const mainTypes = new Set(["album", "ep", "single"]);

    return releases.filter((release) => {
      const type = (release.type || "Other").toLowerCase();
      if (activeFiltersLower.has(type)) return true;
      return activeFiltersLower.has("other") && !mainTypes.has(type);
    });
  }, [releases, activeFilters]);

  const handleToggleRelease = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    const selected = releases.filter(r => selectedIds.includes(r.id));
    onAdd(selected);
  };

  return (
    <div className="w-full bg-muted/10 border-2 border-primary/20 rounded-[2.5rem] p-8 md:p-12 animate-in zoom-in duration-500 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tight mb-2">{artistName}</h2>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-[0.2em] font-bold opacity-70">
            Select albums or EPs to add to your session
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={onCancel} 
            className="font-mono uppercase font-black tracking-widest text-[10px] h-12 px-6"
          >
            Cancel
          </Button>
          <Button 
            disabled={selectedIds.length === 0}
            onClick={handleAdd}
            className="bg-primary text-primary-foreground font-mono font-black uppercase tracking-widest px-10 h-12 rounded-xl shadow-lg shadow-primary/20"
          >
            Add Selected ({selectedIds.length})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="font-mono text-xs uppercase font-bold tracking-widest text-muted-foreground">Loading discography...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <ReleaseFilters activeFilters={activeFilters} onToggleFilter={toggleFilter} />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedIds(filteredReleases.map(r => r.id))}
                className="font-mono text-[9px] uppercase font-bold tracking-widest h-8"
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedIds([])}
                className="font-mono text-[9px] uppercase font-bold tracking-widest h-8"
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
            {filteredReleases.map((release) => (
              <div 
                key={release.id}
                onClick={() => handleToggleRelease(release.id)}
                className={`group flex items-center gap-4 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedIds.includes(release.id)
                    ? "border-primary bg-primary/5 shadow-md ring-4 ring-primary/5"
                    : "border-transparent bg-background/40 hover:border-border hover:bg-background/60"
                }`}
              >
                <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0 shadow-sm">
                  {/* Reuse image logic or cover component */}
                  <div className="bg-muted w-full h-full flex items-center justify-center font-mono text-[10px] font-bold text-muted-foreground uppercase">
                    {release.title.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-mono text-xs font-black uppercase truncate ${selectedIds.includes(release.id) ? "text-primary" : ""}`}>
                    {release.title}
                  </h4>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold opacity-60">
                    {release.type || "Other"}
                  </p>
                </div>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  selectedIds.includes(release.id)
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-transparent"
                }`}>
                  <Check className="h-3 w-3" strokeWidth={4} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
