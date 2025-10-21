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
  // Enhanced details
  price?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
  };
  release_date?: {
    coming_soon: boolean;
    date: string;
  };
  developers?: string[];
  publishers?: string[];
  genres?: string[];
  categories?: string[];
  metacritic?: {
    score: number;
    url: string;
  };
  recommendations?: {
    total: number;
    positive: number;
    negative: number;
    score_desc?: string;
  };
  platforms?: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
}

// Cache for Steam app list to avoid repeated fetches
let cachedAppList: SteamGame[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Cache for Steam game details to avoid repeated fetches
const gameDetailsCache = new Map<number, { data: SteamGameDetails; timestamp: number }>();
const GAME_DETAILS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

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
  const now = Date.now();
  
  // Check cache first
  const cached = gameDetailsCache.get(appId);
  if (cached && (now - cached.timestamp) < GAME_DETAILS_CACHE_DURATION) {
    return cached.data;
  }

  try {
    // First get basic game details from Store API
    const storeResponse = await axios.get(
      `https://store.steampowered.com/api/appdetails?appids=${appId}`,
      { 
        timeout: 15000, // 15 second timeout (Steam can be slow)
        params: {
          cc: 'no', // Currency code - Norwegian Kroner
          l: 'norwegian' // Language
        }
      }
    );
    
    const storeData = storeResponse.data[appId];
    
    if (!storeData || !storeData.success) {
      return null;
    }
    
    const gameData = storeData.data;
    
    // Now get review data from Steam User Reviews API
    let reviewData = null;
    try {
      const reviewResponse = await axios.get(
        `https://store.steampowered.com/appreviews/${appId}?json=1&language=norwegian&num_per_page=0&filter=all&review_type=all&purchase_type=all`,
        { timeout: 10000 }
      );
      reviewData = reviewResponse.data;
    } catch (reviewError) {
      // Silently handle review data fetch errors
    }
    
    
    // Only return if it's a game (not DLC, video, etc.)
    if (gameData.type !== 'game') {
      return null;
    }
    
    // Validate that required fields exist
    if (!gameData.name || !gameData.header_image) {
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
      return null;
    }
    
    // Extract price information
    const priceInfo = gameData.price_overview ? {
      currency: gameData.price_overview.currency,
      initial: gameData.price_overview.initial,
      final: gameData.price_overview.final,
      discount_percent: gameData.price_overview.discount_percent,
    } : undefined;

    // Extract release date
    const releaseDate = gameData.release_date ? {
      coming_soon: gameData.release_date.coming_soon,
      date: gameData.release_date.date,
    } : undefined;

    // Extract developers and publishers
    const developers = gameData.developers || [];
    const publishers = gameData.publishers || [];

    // Extract genres
    const genres = gameData.genres ? gameData.genres.map((g: any) => g.description) : [];

    // Extract categories
    const categories = gameData.categories ? gameData.categories.map((c: any) => c.description) : [];

    // Extract metacritic score
    const metacritic = gameData.metacritic ? {
      score: gameData.metacritic.score,
      url: gameData.metacritic.url,
    } : undefined;

  // Extract recommendations (user reviews) - Use User Reviews API data first
  let recommendations = undefined;
  
  // First try to get review data from the User Reviews API (more reliable)
  if (reviewData && reviewData.query_summary) {
    const summary = reviewData.query_summary;
    recommendations = {
      total: summary.total_reviews || 0,
      positive: summary.total_positive || 0,
      negative: summary.total_negative || 0,
    };
  }
  
  // Fallback to Store API data if User Reviews API didn't work
  if (!recommendations || recommendations.total === 0) {
    if (gameData.total_reviews && gameData.total_reviews > 0) {
      recommendations = {
        total: gameData.total_reviews,
        positive: gameData.positive_reviews || 0,
        negative: gameData.negative_reviews || 0,
      };
    } else if (gameData.total_positive !== undefined && gameData.total_negative !== undefined) {
      recommendations = {
        total: (gameData.total_positive || 0) + (gameData.total_negative || 0),
        positive: gameData.total_positive || 0,
        negative: gameData.total_negative || 0,
      };
    } else if (gameData.reviews && gameData.reviews.total_reviews) {
      recommendations = {
        total: gameData.reviews.total_reviews || 0,
        positive: gameData.reviews.total_positive || 0,
        negative: gameData.reviews.total_negative || 0,
      };
    }
  }
  
  // If we still don't have review data, try to get it from review_score fields
  if (!recommendations && gameData.review_score !== undefined) {
    // Steam sometimes provides review_score and review_score_desc instead of raw numbers
    // We can't calculate exact ratios, but we can show the score description
    recommendations = {
      total: 0, // Unknown total
      positive: 0,
      negative: 0,
      score_desc: gameData.review_score_desc || 'Unknown'
    };
  }

    // Extract platform support
    const platforms = gameData.platforms ? {
      windows: gameData.platforms.windows || false,
      mac: gameData.platforms.mac || false,
      linux: gameData.platforms.linux || false,
    } : undefined;

    const gameDetails: SteamGameDetails = {
      appid: appId,
      name: gameData.name,
      header_image: gameData.header_image,
      short_description: gameData.short_description,
      type: gameData.type,
      price: priceInfo,
      release_date: releaseDate,
      developers,
      publishers,
      genres,
      categories,
      metacritic,
      recommendations,
      platforms,
    };

    // Cache the result
    gameDetailsCache.set(appId, { data: gameDetails, timestamp: now });
    
    return gameDetails;
  } catch (error: any) {
    // Silently handle Steam API errors
    return null;
  }
}

export function isValidSteamAppId(appId: number): boolean {
  return Number.isInteger(appId) && appId > 0;
}

