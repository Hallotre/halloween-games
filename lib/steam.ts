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
      'https://api.steampowered.com/ISteamApps/GetAppList/v2/',
      { timeout: 10000 } // 10 second timeout
    );
    
    cachedAppList = response.data.applist.apps;
    cacheTimestamp = now;
    
    return cachedAppList || [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching Steam app list:', error);
    } else {
      console.error('Error fetching Steam app list');
    }
    // Return cached data even if expired, if available
    if (cachedAppList) {
      return cachedAppList;
    }
    return [];
  }
}

// Common stop words to ignore in searches
const STOP_WORDS = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'at', 'to', 'for']);

// Popular horror/spooky games for boosting (case-insensitive)
const POPULAR_HORROR_GAMES = [
  'resident evil', 'silent hill', 'outlast', 'amnesia', 'dead space', 
  'phasmophobia', 'alien isolation', 'dying light', 'until dawn', 'soma',
  'layers of fear', 'the evil within', 'dead by daylight', 'little nightmares',
  'five nights at freddy', 'bioshock', 'left 4 dead', 'prey', 'metro',
  'the forest', 'subnautica', 'grounded', 'the long dark', 'dont starve'
];

// Convert Roman numerals to numbers for better matching
function normalizeRomanNumerals(text: string): string {
  const romanMap: { [key: string]: string } = {
    ' i ': ' 1 ', ' ii ': ' 2 ', ' iii ': ' 3 ', ' iv ': ' 4 ', ' v ': ' 5 ',
    ' vi ': ' 6 ', ' vii ': ' 7 ', ' viii ': ' 8 ', ' ix ': ' 9 ', ' x ': ' 10 '
  };
  
  let normalized = ' ' + text.toLowerCase() + ' ';
  for (const [roman, number] of Object.entries(romanMap)) {
    normalized = normalized.replace(new RegExp(roman, 'g'), number);
  }
  return normalized.trim();
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
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

// Filter out common junk patterns
function isLikelyJunk(name: string): boolean {
  const lowerName = name.toLowerCase();
  const junkPatterns = [
    /^test\s/i,
    /\bsoundtrack\b/i,
    /\bost\b/i,
    /\bartbook\b/i,
    /\bwallpaper\b/i,
    /\btrailer\b/i,
    /\bpack\b.*\bdlc\b/i,
    /^dlc:/i,
    /\bskin pack\b/i,
    /\bskins?\b.*\bonly\b/i,
  ];
  
  return junkPatterns.some(pattern => pattern.test(name));
}

export async function searchSteamGames(query: string): Promise<SteamGame[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const appList = await getSteamAppList();
  const lowerQuery = query.toLowerCase().trim();
  
  // Normalize query: remove stop words and handle Roman numerals
  const normalizedQuery = normalizeRomanNumerals(lowerQuery);
  const queryWords = normalizedQuery.split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  
  // Search and filter games with advanced relevance scoring
  const scoredResults = appList
    .map(game => {
      // Skip obvious junk
      if (isLikelyJunk(game.name)) {
        return null;
      }
      
      const lowerName = game.name.toLowerCase();
      const normalizedName = normalizeRomanNumerals(lowerName);
      let score = 0;
      
      // Exact match (highest priority)
      if (lowerName === lowerQuery || normalizedName === normalizedQuery) {
        score = 10000;
      }
      // Starts with query (very high priority)
      else if (lowerName.startsWith(lowerQuery) || normalizedName.startsWith(normalizedQuery)) {
        score = 5000;
      }
      // Contains exact query
      else if (lowerName.includes(lowerQuery) || normalizedName.includes(normalizedQuery)) {
        score = 1000;
      }
      // Fuzzy match (typo tolerance)
      else if (query.length >= 5) {
        const distance = levenshteinDistance(lowerQuery, lowerName);
        const maxDistance = Math.floor(query.length * 0.3); // Allow 30% difference
        if (distance <= maxDistance) {
          score = 500 - (distance * 50);
        }
      }
      
      // Multi-word matching
      if (score === 0 && queryWords.length > 0) {
        const nameWords = normalizedName.split(/\s+/).filter(w => !STOP_WORDS.has(w));
        
        // All query words present
        if (queryWords.every(qw => nameWords.some(nw => nw.includes(qw) || qw.includes(nw)))) {
          score = 300;
        }
        // Most query words present (at least 60%)
        else if (queryWords.length > 1) {
          const matchCount = queryWords.filter(qw => 
            nameWords.some(nw => nw.includes(qw) || qw.includes(nw))
          ).length;
          const matchPercent = matchCount / queryWords.length;
          if (matchPercent >= 0.6) {
            score = Math.floor(200 * matchPercent);
          }
        }
        // At least one significant word matches
        else if (queryWords.some(qw => qw.length > 3 && nameWords.some(nw => nw.includes(qw)))) {
          score = 50;
        }
      }
      
      // Acronym matching (e.g., "RE" for "Resident Evil")
      if (query.length <= 4 && query === query.toUpperCase()) {
        const nameInitials = game.name.split(/\s+/)
          .filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()))
          .map(w => w[0].toUpperCase())
          .join('');
        if (nameInitials === query.toUpperCase()) {
          score = Math.max(score, 2000);
        }
      }
      
      // No match
      if (score === 0) {
        return null;
      }
      
      // Boost popular horror games
      if (POPULAR_HORROR_GAMES.some(horror => lowerName.includes(horror))) {
        score += 500;
      }
      
      // Boost score for shorter names (usually more relevant)
      const lengthBonus = Math.max(0, 100 - game.name.length);
      score += lengthBonus;
      
      // Penalize names with excessive special characters (usually junk/DLC)
      const specialCharCount = (game.name.match(/[^a-zA-Z0-9\s]/g) || []).length;
      score -= specialCharCount * 3;
      
      // Penalize very long names (likely to be bundles/special editions)
      if (game.name.length > 80) {
        score -= 100;
      }
      
      // Boost if query words appear early in the name
      if (lowerName.indexOf(lowerQuery) < 10) {
        score += 200;
      }
      
      return { game, score };
    })
    .filter((item): item is { game: SteamGame; score: number } => item !== null && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25) // Get top 25 results
    .map(item => item.game);
  
  return scoredResults;
}

export async function getSteamGameDetails(appId: number): Promise<SteamGameDetails | null> {
  try {
    const response = await axios.get(
      `https://store.steampowered.com/api/appdetails?appids=${appId}`,
      { 
        timeout: 15000, // 15 second timeout (Steam can be slow)
        params: {
          cc: 'us', // Currency code
          l: 'english' // Language
        }
      }
    );
    
    const data = response.data[appId];
    
    if (!data || !data.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Steam API returned no data for appId ${appId}`);
      }
      return null;
    }
    
    const gameData = data.data;
    
    // Only return if it's a game (not DLC, video, etc.)
    if (gameData.type !== 'game') {
      if (process.env.NODE_ENV === 'development') {
        console.log(`AppId ${appId} is not a game, it's a ${gameData.type}`);
      }
      return null;
    }
    
    // Validate that required fields exist
    if (!gameData.name || !gameData.header_image) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`AppId ${appId} missing required fields`);
      }
      return null;
    }
    
    // Filter out obvious non-games by name patterns
    const nameLower = gameData.name.toLowerCase();
    const invalidPatterns = [
      'soundtrack',
      'ost ',
      ' ost',
      'original sound track',
      'artbook',
      'art book',
      'demo',
      'beta',
      'playtest',
      'dedicated server',
      'dev tools',
      'editor',
    ];
    
    if (invalidPatterns.some(pattern => nameLower.includes(pattern))) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`AppId ${appId} (${gameData.name}) appears to be DLC/content, not a game`);
      }
      return null;
    }
    
    return {
      appid: appId,
      name: gameData.name,
      header_image: gameData.header_image,
      short_description: gameData.short_description,
      type: gameData.type,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      if (error.response?.status === 429) {
        console.error(`Rate limited by Steam API for appId ${appId}`);
      } else {
        console.error(`Error fetching Steam game details for appId ${appId}:`, error.message);
      }
    } else {
      console.error(`Error fetching Steam game details for appId ${appId}`);
    }
    return null;
  }
}

export function isValidSteamAppId(appId: number): boolean {
  return Number.isInteger(appId) && appId > 0;
}

