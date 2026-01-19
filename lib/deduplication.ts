/**
 * Utility for normalizing song titles and identifying potential duplicates.
 */

const SUFFIXES_TO_STRIP = [
  /\(instrumental\)/gi,
  /\(a capella\)/gi,
  /\(acapella\)/gi,
  /\(live.*\)/gi,
  /\(demo.*\)/gi,
  /\(remastered.*\)/gi,
  /\[remastered.*\]/gi,
  /\(edit.*\)/gi,
  /\(version.*\)/gi,
  /\(feat\..*\)/gi,
  /\(with.*\)/gi,
  /- instrumental/gi,
  /- live/gi,
  /- demo/gi,
  /- remastered/gi,
  /- [0-9]{4} remaster/gi,
  /\([0-9]{4} remaster\)/gi,
];

/**
 * Cleans a song title by removing common suffixes and extra whitespace.
 */
export function normalizeTitle(title: string): string {
  let normalized = title.toLowerCase();
  
  // Apply regex filters for common suffixes
  for (const regex of SUFFIXES_TO_STRIP) {
    normalized = normalized.replace(regex, "");
  }

  // Remove common punctuation that might vary
  normalized = normalized.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");
  
  // Remove extra whitespace and trim
  return normalized.replace(/\s+/g, " ").trim();
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates a similarity score between 0 and 100.
 */
export function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 100;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  // Optimization: If length difference is too large, it can't be a high match
  const maxLength = Math.max(len1, len2);
  const minLength = Math.min(len1, len2);
  if (minLength / maxLength < 0.7) return 0;

  const distance = levenshteinDistance(s1, s2);
  return Math.floor(((maxLength - distance) / maxLength) * 100);
}

export interface DuplicateGroup {
  canonical: string;
  matches: string[];
  matchIndices: number[];
  confidence: number;
}

/**
 * Identifies potential duplicates in a list of songs.
 * Returns groups of songs that are likely the same.
 */
export function findPotentialDuplicates(songs: string[]): DuplicateGroup[] {
  const normalizedMap = new Map<string, number[]>();
  const groups: DuplicateGroup[] = [];
  const processed = new Set<number>();

  // First pass: Exact matches after normalization
  for (let i = 0; i < songs.length; i++) {
    const norm = normalizeTitle(songs[i]);
    if (!normalizedMap.has(norm)) {
      normalizedMap.set(norm, []);
    }
    normalizedMap.get(norm)!.push(i);
  }

  // Second pass: Group items that normalized to the same string
  for (const [, indices] of normalizedMap.entries()) {
    if (indices.length > 1) {
      groups.push({
        canonical: songs[indices[0]],
        matches: indices.map(idx => songs[idx]),
        matchIndices: indices,
        confidence: 100,
      });
      indices.forEach(idx => processed.add(idx));
    }
  }

  // Third pass: Fuzzy matching for remaining items
  const remainingIndices = songs.map((_, i) => i).filter(i => !processed.has(i));
  
  for (let i = 0; i < remainingIndices.length; i++) {
    const idxA = remainingIndices[i];
    if (processed.has(idxA)) continue;
    
    const currentMatchIndices: number[] = [idxA];
    let maxSimilarity = 0;

    for (let j = i + 1; j < remainingIndices.length; j++) {
      const idxB = remainingIndices[j];
      if (processed.has(idxB)) continue;

      const similarity = calculateSimilarity(
        normalizeTitle(songs[idxA]),
        normalizeTitle(songs[idxB])
      );

      if (similarity > 85) {
        currentMatchIndices.push(idxB);
        processed.add(idxB);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    if (currentMatchIndices.length > 1) {
      groups.push({
        canonical: songs[idxA],
        matches: currentMatchIndices.map(idx => songs[idx]),
        matchIndices: currentMatchIndices,
        confidence: maxSimilarity,
      });
      processed.add(idxA);
    }
  }

  return groups;
}
