# Song Ranker - Development Log

**Last Updated**: January 18, 2026  
**Status**: ✅ **ACTIVE** - Ongoing decision and change tracking

---

## 📋 **Decision Log**

### **Decision #7: Robust Deduplication & Normalization Logic**
**Date**: January 18, 2026
**Author**: opencode (Interactive Agent)

**What Changed**:
- Refactored `lib/deduplication.ts` and `DeduplicationModal.tsx` to use original array indices for identifying and removing duplicate songs.
- Enhanced `normalizeTitle` to include more aggressive cleaning (stripping punctuation and common metadata variations).
- Implemented performance heuristics (length checks) in `calculateSimilarity` to optimize $O(N^2)$ fuzzy matching.
- Added loading states in `Catalog.tsx` to prevent starting a ranking session while track data is still being fetched in the background.

**Why**:
- Previous implementation used string matching for removal, which caused all instances of a song (e.g., from different albums) to be deleted if one was flagged as a duplicate.
- Users encountered "empty" sessions when selecting the same song from multiple releases.
- Robust normalization ensures that "Song Name (2024 Remaster)" and "Song Name" are correctly identified as duplicates.
- Loading states prevent race conditions where a session starts with an incomplete track list.

**Impact**:
- Resolved a critical data loss bug where users lost songs they intended to rank.
- Improved accuracy of the "Review Duplicates" step.
- Smoother UX when selecting multiple releases from a large catalog.

---

## 🐛 **Issues Tracking**

### **Issue: Total Removal of Duplicated Songs (RESOLVED)**
- **Problem**: The filter logic removed every instance of a song string if it was in the `songsToRemove` set.
- **Impact**: Critical; users lost all copies of a song if it appeared in more than one selected release.
- **Resolution**: Switched to index-based tracking. The `DuplicateGroup` now carries `matchIndices` which refer back to the original `allSongs` array.

---

## ✅ **Validation Results**

### **Deduplication Logic Validation**
**Date**: January 18, 2026  
**Status**: ✅ Passed
- ✅ Exact duplicates across releases are correctly grouped.
- ✅ Merging a group keeps exactly ONE instance (the canonical one).
- ✅ "Keep Both" correctly preserves all original instances.
- ✅ Normalization strips common remastered/live/demo suffixes.
- ✅ ESLint passed without errors.

---

## 📚 **Lessons Learned**
- **Trust but Verify Indices**: When working with lists of items that can have identical string representations (like song titles), always use unique IDs or array indices for selection/removal logic.
- **Metadata is Messy**: Metadata from external APIs (like Spotify or MusicBrainz) is highly inconsistent; normalization must be aggressive for comparison but the original strings should be preserved for display.
