"use client";

import { useRef, type JSX } from "react";
import { Search, Link as LinkIcon, Loader2, X, Music } from "lucide-react";
import { cn } from "@/lib/utils";

type UnifiedSearchBarProps = Readonly<{
  query: string;
  onQueryChange: (query: string) => void;
  suggestions: string[];
  showSuggestions: boolean;
  loadingSuggestions: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onImportPlaylist: (url: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
}>;

export function UnifiedSearchBar({
  query,
  onQueryChange,
  suggestions,
  showSuggestions,
  loadingSuggestions,
  onSuggestionClick,
  onImportPlaylist,
  onFocus,
  onBlur,
  placeholder = "Paste playlist link or search artist...",
}: UnifiedSearchBarProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // URL detection regex
  const isPlaylistUrl = (val: string) => {
    const spotifyRegex = /^(https:\/\/open\.spotify\.com\/playlist\/|spotify:playlist:)[a-zA-Z0-9]+/;
    const appleMusicRegex = /^https:\/\/music\.apple\.com\/[a-z]{2}\/playlist\/[a-zA-Z0-9.\-]+/;
    return spotifyRegex.test(val) || appleMusicRegex.test(val);
  };

  const isUrl = isPlaylistUrl(query);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isUrl) {
      onImportPlaylist(query);
    }
  };

  return (
    <div className="relative w-full group">
      <div className={cn(
        "relative flex items-center transition-all duration-300 rounded-3xl border-2 bg-background shadow-xl overflow-hidden",
        isUrl ? "border-primary/40 ring-8 ring-primary/5" : "border-border/60 focus-within:border-primary/30 focus-within:ring-8 focus-within:ring-primary/5"
      )}>
        <div className="pl-6 pointer-events-none">
          {isUrl ? (
            <LinkIcon className="h-6 w-6 text-primary animate-in zoom-in duration-300" />
          ) : (
            <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 h-16 md:h-20 px-4 md:px-6 bg-transparent border-none focus:outline-none font-mono text-lg md:text-xl placeholder:text-muted-foreground/50"
          autoFocus
        />

        <div className="pr-4 flex items-center gap-2">
          {query && (
            <button 
              onClick={() => onQueryChange("")}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          
          {loadingSuggestions && (
            <Loader2 className="h-6 w-6 text-primary animate-spin mr-2" />
          )}

          {isUrl && (
            <button
              onClick={() => onImportPlaylist(query)}
              className="bg-primary text-primary-foreground font-mono font-black uppercase tracking-widest px-6 py-3 rounded-2xl hover:scale-105 transition-transform animate-in slide-in-from-right-4"
            >
              Import
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && !isUrl && (
        <div className="absolute top-full left-0 right-0 mt-4 bg-popover border border-border rounded-3xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-xl border-primary/10">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full text-left px-6 py-4 text-base md:text-lg font-mono font-black uppercase tracking-tight hover:bg-primary/5 hover:text-primary transition-all rounded-2xl flex items-center gap-4 group/item"
            >
              <div className="h-10 w-10 rounded-xl bg-muted group-hover/item:bg-primary/10 flex items-center justify-center transition-colors">
                <Music className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
              </div>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
