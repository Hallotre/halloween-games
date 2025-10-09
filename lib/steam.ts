import axios from 'axios';

export interface SteamGame {
  appid: number;
  name: string;
}

export interface SteamGameDetails {
  appid: number;
  name: string;
  header_image: string;
  short_description?: string;
  type: string;
}

// Cache for Steam app list to avoid repeated fetches
let cachedAppList: SteamGame[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getSteamAppList(): Promise<SteamGame[]> {
  const now = Date.now();
  
  // Return cached data if available and not expired
  if (cachedAppList && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedAppList;
  }

  try {
    const response = await axios.get(
      'https://api.steampowered.com/ISteamApps/GetAppList/v2/'
    );
    
    cachedAppList = response.data.applist.apps;
    cacheTimestamp = now;
    
    return cachedAppList || [];
  } catch (error) {
    console.error('Error fetching Steam app list:', error);
    // Return cached data even if expired, if available
    if (cachedAppList) {
      return cachedAppList;
    }
    return [];
  }
}

export async function searchSteamGames(query: string): Promise<SteamGame[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const appList = await getSteamAppList();
  const lowerQuery = query.toLowerCase();
  
  // Search and filter games
  const results = appList
    .filter(game => game.name.toLowerCase().includes(lowerQuery))
    .slice(0, 10); // Limit to 10 results
  
  return results;
}

export async function getSteamGameDetails(appId: number): Promise<SteamGameDetails | null> {
  try {
    const response = await axios.get(
      `https://store.steampowered.com/api/appdetails?appids=${appId}`
    );
    
    const data = response.data[appId];
    
    if (!data || !data.success) {
      return null;
    }
    
    const gameData = data.data;
    
    // Only return if it's a game (not DLC, video, etc.)
    if (gameData.type !== 'game') {
      return null;
    }
    
    return {
      appid: appId,
      name: gameData.name,
      header_image: gameData.header_image,
      short_description: gameData.short_description,
      type: gameData.type,
    };
  } catch (error) {
    console.error(`Error fetching Steam game details for appId ${appId}:`, error);
    return null;
  }
}

export function isValidSteamAppId(appId: number): boolean {
  return Number.isInteger(appId) && appId > 0;
}

