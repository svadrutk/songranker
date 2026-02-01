import { type SessionSong } from "./api";

/**
 * Comparison history for tracking which pairs have been compared
 */
export interface ComparisonHistory {
  // Set of "songId1:songId2" strings (always sorted alphabetically)
  comparedPairs: Set<string>;
  // Recent song IDs to avoid repetition (last N songs that appeared)
  recentSongIds: string[];
}

/**
 * Create a pair key from two song IDs (sorted for consistency)
 */
function makePairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
}

/**
 * Randomly shuffle the order of a pair to avoid position bias
 * (prevents stronger song from always appearing on the same side)
 */
function shufflePair(a: SessionSong, b: SessionSong): [SessionSong, SessionSong] {
  return Math.random() < 0.5 ? [a, b] : [b, a];
}

/**
 * Get effective strength for sorting
 * Now uses θ (log-strength) directly if available, which is more numerically stable
 */
function getStrength(song: SessionSong): number {
  // bt_strength is now θ (log-strength from choix), can be negative
  if (song.bt_strength != null) {
    return song.bt_strength;
  }
  // Fallback: convert Elo to approximate θ
  // θ ≈ (Elo - 1500) / 173.72
  return (song.local_elo - 1500) / 173.72;
}

/**
 * Calculate uncertainty score for a song
 * Higher = more uncertain = needs more comparisons
 */
function getUncertainty(song: SessionSong): number {
  const comps = song.comparison_count ?? 0;
  // Steep dropoff: 0 comps = 1.0, 3 comps = 0.25, 6 comps = 0.11
  return 1 / (comps + 1);
}

/**
 * Determine which phase of ranking we're in
 * Uses comparison_count from songs (includes all comparisons)
 * 
 * Key insight: Always prioritize coverage if ANY song is severely under-compared
 */
function getPhase(songs: SessionSong[]): "coverage" | "refinement" | "verification" {
  const counts = songs.map((s) => s.comparison_count ?? 0);
  const minComps = Math.min(...counts);
  const maxComps = Math.max(...counts);
  const avgComps = counts.reduce((a, b) => a + b, 0) / songs.length;

  // ALWAYS stay in coverage mode if any song is severely under-compared
  // This prevents the "20 vs 3" imbalance problem
  if (minComps < 3) {
    return "coverage";
  }
  
  // Even if min >= 3, if there's a huge imbalance, go back to coverage
  // This catches cases where top songs get over-compared while bottom songs lag
  if (maxComps > minComps * 3 && minComps < 5) {
    return "coverage"; // Force more even distribution
  }

  if (avgComps < 4) {
    return "refinement";
  }
  
  return "verification";
}

/**
 * Find candidate pairs, optionally excluding already-compared pairs
 */
function getCandidatePairs(
  songs: SessionSong[],
  history?: ComparisonHistory
): Array<{ a: SessionSong; b: SessionSong; score: number }> {
  const candidates: Array<{ a: SessionSong; b: SessionSong; score: number }> = [];

  for (let i = 0; i < songs.length; i++) {
    for (let j = i + 1; j < songs.length; j++) {
      const a = songs[i];
      const b = songs[j];
      const pairKey = makePairKey(a.song_id, b.song_id);

      // Skip if already compared (unless we need to allow repeats)
      const alreadyCompared = history?.comparedPairs.has(pairKey) ?? false;

      // Score based on information gain:
      // - Higher if either song is under-compared
      // - Slightly higher if strengths are similar (helps distinguish close songs)
      const uncertaintyA = getUncertainty(a);
      const uncertaintyB = getUncertainty(b);
      const combinedUncertainty = uncertaintyA + uncertaintyB;

      const strengthDiff = Math.abs(getStrength(a) - getStrength(b));
      // Prefer close matches when both songs are well-tested
      // Prefer any match when songs are under-tested
      const closenessBonus =
        combinedUncertainty < 0.5 ? 1 / (strengthDiff + 0.1) : 0;

      const score = combinedUncertainty * 10 + closenessBonus;

      candidates.push({
        a,
        b,
        score: alreadyCompared ? score * 0.1 : score, // Heavy penalty for repeats
      });
    }
  }

  return candidates.sort((x, y) => y.score - x.score);
}

/**
 * PHASE 1: Coverage Mode
 * Goal: Get every song to at least 3 comparisons AND learn where they rank
 * Strategy: Pair under-compared songs with WELL-COMPARED songs (not other under-compared)
 * 
 * Key insight: Pairing two under-compared songs together only tells us they exist.
 * Pairing an under-compared song with a well-established song tells us WHERE it ranks.
 * 
 * UX improvement: Avoid showing the same song repeatedly (cooldown on recent songs)
 */
function selectCoveragePair(
  songs: SessionSong[],
  history?: ComparisonHistory
): [SessionSong, SessionSong] {
  const recentSongs = new Set(history?.recentSongIds ?? []);
  
  // Sort by comparison count (ascending) to find under-compared songs
  const sortedByComps = [...songs].sort(
    (a, b) => (a.comparison_count ?? 0) - (b.comparison_count ?? 0)
  );

  // Find under-compared songs (within 1 comparison of the minimum)
  const minComps = sortedByComps[0].comparison_count ?? 0;
  const underCompared = sortedByComps.filter(
    (s) => (s.comparison_count ?? 0) <= minComps + 1
  );

  // Prefer under-compared songs that WEREN'T recently shown (cooldown)
  // This prevents the same song appearing 5 times in a row
  const freshUnderCompared = underCompared.filter((s) => !recentSongs.has(s.song_id));
  
  // Pick songA: prefer fresh under-compared, fall back to any under-compared
  const songA = freshUnderCompared.length > 0 
    ? freshUnderCompared[0] 
    : underCompared[0];
  const songAComps = songA.comparison_count ?? 0;

  // Find well-compared songs (at least 2 more comparisons than songA, or >= 3 comparisons)
  // Also prefer songs that weren't recently shown
  const wellCompared = songs.filter((s) => {
    const comps = s.comparison_count ?? 0;
    return s.song_id !== songA.song_id && (comps >= songAComps + 2 || comps >= 3);
  });
  
  // Sort well-compared: prefer non-recent, then by strength (mid-ranked first)
  const sortedWellCompared = [...wellCompared].sort((a, b) => {
    const aRecent = recentSongs.has(a.song_id) ? 1 : 0;
    const bRecent = recentSongs.has(b.song_id) ? 1 : 0;
    if (aRecent !== bRecent) return aRecent - bRecent; // Non-recent first
    return getStrength(b) - getStrength(a); // Then by strength
  });

  if (sortedWellCompared.length > 0) {
    // Target middle third for mid-ranked opponents
    const midStart = Math.floor(sortedWellCompared.length / 3);
    const midEnd = Math.ceil((sortedWellCompared.length * 2) / 3);
    const midRanked = sortedWellCompared.slice(midStart, Math.max(midEnd, midStart + 1));

    // Find one we haven't compared with yet, preferring mid-ranked
    for (const songB of midRanked) {
      const pairKey = makePairKey(songA.song_id, songB.song_id);
      if (!history?.comparedPairs.has(pairKey)) {
        return shufflePair(songA, songB);
      }
    }

    // If all mid-ranked are compared, try any well-compared song
    for (const songB of sortedWellCompared) {
      const pairKey = makePairKey(songA.song_id, songB.song_id);
      if (!history?.comparedPairs.has(pairKey)) {
        return shufflePair(songA, songB);
      }
    }
  }

  // Fallback: no well-compared songs available (early in session)
  // Pair with the song that has the most comparisons, preferring non-recent
  const sortedDesc = [...songs]
    .filter((s) => s.song_id !== songA.song_id)
    .sort((a, b) => {
      const aRecent = recentSongs.has(a.song_id) ? 1 : 0;
      const bRecent = recentSongs.has(b.song_id) ? 1 : 0;
      if (aRecent !== bRecent) return aRecent - bRecent;
      return (b.comparison_count ?? 0) - (a.comparison_count ?? 0);
    });

  for (const songB of sortedDesc) {
    const pairKey = makePairKey(songA.song_id, songB.song_id);
    if (!history?.comparedPairs.has(pairKey)) {
      return shufflePair(songA, songB);
    }
  }

  // All pairs with songA have been compared; pick any other song
  const songB = sortedDesc[0];
  return shufflePair(songA, songB);
}

/**
 * PHASE 2: Refinement Mode
 * Goal: Build confidence in rankings
 * Strategy: Compare songs with similar strength (close θ values) who are both somewhat uncertain
 */
function selectRefinementPair(
  songs: SessionSong[],
  history?: ComparisonHistory
): [SessionSong, SessionSong] {
  const candidates = getCandidatePairs(songs, history);

  if (candidates.length === 0) {
    // Fallback: random
    const a = songs[Math.floor(Math.random() * songs.length)];
    let b = songs[Math.floor(Math.random() * songs.length)];
    while (b.song_id === a.song_id) {
      b = songs[Math.floor(Math.random() * songs.length)];
    }
    return shufflePair(a, b); // Randomize position to avoid bias
  }

  // Pick from top 5 candidates with some randomness
  const topN = Math.min(5, candidates.length);
  const selected = candidates[Math.floor(Math.random() * topN)];
  return shufflePair(selected.a, selected.b); // Randomize position to avoid bias
}

/**
 * PHASE 3: Verification Mode
 * Goal: Confirm top rankings are correct
 * Strategy: Target adjacent pairs with highest uncertainty (smallest θ gap + least comparisons)
 */
function selectVerificationPair(
  songs: SessionSong[],
  history?: ComparisonHistory
): [SessionSong, SessionSong] {
  // Sort by strength
  const sorted = [...songs].sort((a, b) => getStrength(b) - getStrength(a));

  // Score adjacent pairs by uncertainty: smaller gap + fewer comparisons = higher priority
  const adjacentPairs: Array<{
    a: SessionSong;
    b: SessionSong;
    score: number;
    compared: boolean;
  }> = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const gap = Math.abs(getStrength(a) - getStrength(b));
    const minComps = Math.min(a.comparison_count ?? 0, b.comparison_count ?? 0);
    const pairKey = makePairKey(a.song_id, b.song_id);
    const compared = history?.comparedPairs.has(pairKey) ?? false;

    // Score: prefer small gaps (close ranks) and under-compared songs
    // Higher score = more valuable to compare
    const gapScore = 1 / (gap + 0.1); // Smaller gap = higher score
    const uncertaintyScore = 1 / (minComps + 1); // Fewer comparisons = higher score
    const positionBonus = i < 10 ? 2 : 1; // Prioritize top 10

    adjacentPairs.push({
      a,
      b,
      score: (gapScore + uncertaintyScore * 2) * positionBonus * (compared ? 0.3 : 1),
      compared,
    });
  }

  // Sort by score (highest first) and pick from top candidates
  adjacentPairs.sort((x, y) => y.score - x.score);

  // Pick from top 3 with some randomness to avoid predictability
  const topN = Math.min(3, adjacentPairs.length);
  if (topN > 0) {
    const selected = adjacentPairs[Math.floor(Math.random() * topN)];
    return shufflePair(selected.a, selected.b); // Randomize position to avoid bias
  }

  // Fallback: first two songs
  return shufflePair(sorted[0], sorted[1]); // Randomize position to avoid bias
}

/**
 * Optimized pairing algorithm
 *
 * Key improvements:
 * 1. Phase-aware: Different strategies for coverage vs refinement vs verification
 * 2. Pair tracking: Avoids repeating the same comparison
 * 3. No wasted random: Every comparison is information-rich
 * 4. Priority: Under-compared songs always get picked first
 *
 * @param songs - Array of songs with their current stats
 * @param history - Optional comparison history to avoid repeats
 * @returns Pair of songs to compare, or null if < 2 songs
 */
export function getNextPair(
  songs: SessionSong[],
  history?: ComparisonHistory
): [SessionSong, SessionSong] | null {
  if (songs.length < 2) return null;

  const phase = getPhase(songs);

  switch (phase) {
    case "coverage":
      return selectCoveragePair(songs, history);
    case "refinement":
      return selectRefinementPair(songs, history);
    case "verification":
      return selectVerificationPair(songs, history);
  }
}

/**
 * Create a new comparison history tracker
 */
export function createComparisonHistory(): ComparisonHistory {
  return { comparedPairs: new Set(), recentSongIds: [] };
}

/**
 * Record a comparison in the history
 * Also tracks recent songs to avoid repetition (keeps last 4 song IDs)
 */
export function recordComparison(
  history: ComparisonHistory,
  songAId: string,
  songBId: string
): void {
  history.comparedPairs.add(makePairKey(songAId, songBId));
  
  // Track recent songs (both from this pair)
  // Keep only the last 4 to allow cooldown of ~2 comparisons
  history.recentSongIds.push(songAId, songBId);
  if (history.recentSongIds.length > 4) {
    history.recentSongIds = history.recentSongIds.slice(-4);
  }
}

/**
 * Build comparison history from existing comparisons
 */
export function buildHistoryFromComparisons(
  comparisons: Array<{ song_a_id: string; song_b_id: string }>
): ComparisonHistory {
  const history = createComparisonHistory();
  for (const comp of comparisons) {
    // Just add to comparedPairs, don't track as "recent" since these are historical
    history.comparedPairs.add(makePairKey(comp.song_a_id, comp.song_b_id));
  }
  // Initialize recentSongIds from the last 2 comparisons (last 4 songs)
  const lastComps = comparisons.slice(-2);
  for (const comp of lastComps) {
    history.recentSongIds.push(comp.song_a_id, comp.song_b_id);
  }
  return history;
}
