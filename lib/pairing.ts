import { type SessionSong } from "./api";

/**
 * Pairs two songs for a duel.
 * Strategy: Pick a random song, then find songs with the closest Elo rating.
 * To avoid repetitive pairings, we pick from the candidates with the smallest Elo difference.
 */
export function getNextPair(songs: SessionSong[]): [SessionSong, SessionSong] | null {
  if (songs.length < 2) return null;

  // Pick a random song as the first contestant
  const indexA = Math.floor(Math.random() * songs.length);
  const songA = songs[indexA];

  // Calculate Elo differences for all other songs
  const candidates = songs
    .map((song, index) => ({
      song,
      index,
      diff: Math.abs(song.local_elo - songA.local_elo),
    }))
    .filter((c) => c.index !== indexA)
    .sort((a, b) => a.diff - b.diff);

  if (candidates.length === 0) return null;

  // Pick from the top 3 closest matches to add some variety while keeping matchups competitive
  const poolSize = Math.min(3, candidates.length);
  const randomIndex = Math.floor(Math.random() * poolSize);
  const songB = candidates[randomIndex].song;

  return [songA, songB];
}
