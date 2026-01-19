"use server";

export interface CoverArtArchive {
  artwork: boolean | null;
  back: boolean | null;
  count: number | null;
  darkened: boolean | null;
  front: boolean | null;
  url?: string;
}

export interface ReleaseGroup {
  id: string; // Release Group MBID or Last.fm ID
  title: string;
  artist?: string;
  type: string;
  cover_art?: CoverArtArchive;
}

export interface SongInput {
  name: string;
  artist: string;
  album?: string | null;
  spotify_id?: string | null;
}

export interface SessionCreate {
  user_id?: string | null;
  songs: SongInput[];
}

export interface SessionResponse {
  session_id: string;
  count: number;
}

export interface TrackResponse {
  tracks: string[];
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function searchArtistReleaseGroups(query: string): Promise<ReleaseGroup[]> {
  if (!query) return [];

  try {
    const response = await fetch(`${BACKEND_URL}/search?query=${encodeURIComponent(query)}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching artists:", error);
    return [];
  }
}

export async function getReleaseGroupTracks(id: string): Promise<string[]> {
  if (!id) return [];

  try {
    const response = await fetch(`${BACKEND_URL}/tracks/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data: TrackResponse = await response.json();
    return data.tracks;
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return [];
  }
}

export async function createSession(payload: SessionCreate): Promise<SessionResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[API] Session creation failed:", errorData);
      throw new Error(errorData.detail || `Failed to create session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error in createSession:", error);
    throw error;
  }
}
