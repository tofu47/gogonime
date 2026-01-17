import axios from 'axios'

const API_BASE = 'https://api.sansekai.my.id/api/anime'

// Create axios instance with only browser-allowed headers
// NOTE: Browsers block certain headers for security (User-Agent, Referer, Origin, Accept-Encoding)
const axiosInstance = axios.create({
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  },
})

// Rate limiting with exponential backoff
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 3500 // 3.5 seconds between requests (reduced from 8s for faster loading)
let rateLimitRetryAfter = 0
let requestCount = 0
const MAX_REQUESTS_PER_MINUTE = 10

// Cache system for detail pages and video data
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const detailCache = new Map<string, CacheEntry<any>>()
const videoCache = new Map<string, CacheEntry<any>>()
const CACHE_DURATION_1HOUR = 60 * 60 * 1000 // 1 hour

// localStorage key prefix
const STORAGE_PREFIX = 'gogoanime_'

// Helper to get from localStorage
const getFromStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    if (!item) return null
    const parsed = JSON.parse(item)
    const now = Date.now()
    // Check if cache expired (1 hour)
    if (now - parsed.timestamp > CACHE_DURATION_1HOUR) {
      localStorage.removeItem(STORAGE_PREFIX + key)
      return null
    }
    return parsed.data as T
  } catch (err) {
    console.warn('Storage read error:', err)
    return null
  }
}

// Helper to save to localStorage
const saveToStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + key,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    )
  } catch (err) {
    console.warn('Storage write error:', err)
  }
}

// Mock data for development/fallback
const MOCK_ANIME: Anime[] = [
  {
    id: 1,
    url: 'one-piece-z-01',
    judul: 'One Piece (Movie)',
    cover: 'https://images.unsplash.com/photo-1578926078328-123456789?w=300&h=400&fit=crop',
    lastch: '1135',
    lastup: '2024-01-17',
    status: 'Ongoing',
  },
  {
    id: 2,
    url: 'naruto-shippuden',
    judul: 'Naruto Shippuden',
    cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=400&fit=crop',
    lastch: '500',
    lastup: '2024-01-16',
    status: 'Completed',
  },
  {
    id: 3,
    url: 'demon-slayer',
    judul: 'Demon Slayer',
    cover: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=400&fit=crop',
    lastch: '55',
    lastup: '2024-01-15',
    status: 'Ongoing',
  },
]

const throttleRequest = async (retries = 0): Promise<void> => {
  // Check if we're in rate limit period
  if (rateLimitRetryAfter > Date.now()) {
    const waitTime = Math.ceil((rateLimitRetryAfter - Date.now()) / 1000)
    console.warn(`⏳ API Rate Limited. Waiting ${waitTime}s before retry...`)
    await new Promise(resolve => setTimeout(resolve, rateLimitRetryAfter - Date.now()))
    rateLimitRetryAfter = 0
  }

  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    // Only log throttling for longer waits
    if (waitTime > 2000) {
      console.log(`⏳ Throttling requests...`)
    }
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  lastRequestTime = Date.now()
}

// Helper function to retry requests with exponential backoff on 429 errors
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  initialDelay: number = 3000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Only retry on rate limit (429) errors
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after']
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : initialDelay * Math.pow(2, attempt)
        
        console.log(`⏳ API rate limited. Retrying in ${Math.ceil(delay / 1000)}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        rateLimitRetryAfter = Date.now() + delay
      } else {
        // Don't retry on other errors
        throw error
      }
    }
  }
  
  throw lastError
}

export interface Anime {
  id: number
  url: string
  judul: string
  cover: string
  lastch: string
  lastup: string
}

export interface VideoResolution {
  reso: string
  url: string
}

export interface Episode {
  episode_id: number
  likeCount: number
  dislikeCount: number
  userLikeStatus: number
  reso: string[]
  stream: VideoResolution[]
}

export interface EpisodeResponse {
  data: Episode[]
}

export interface Chapter {
  id: number
  ch: string
  url: string
  date: string
  history: string
  lastDurasi: number | null
  fullDurasi: number | null
}

export interface AnimeDetail {
  id: number
  series_id: string
  bookmark: string | null
  cover: string
  judul: string
  type: string
  countdown: string | null
  status: string
  rating: string
  published: string
  author: string
  genre: string[]
  genreurl: string[]
  sinopsis: string
  chapter: Chapter[]
}

export interface SearchResult {
  id: string
  url: string
  judul: string
  cover: string
  lastch: string
  genre: string[]
  sinopsis: string
  studio: string
  score: string
  status: string
  rilis: string
  total_episode: number
}

export interface SearchResponse {
  data: {
    jumlah: number
    result: SearchResult[]
    pagination: {
      page: number
      per_page: number
      total: number
      total_pages: number
      has_next: boolean
      next_page: string
      next_offset: string
    }
  }[]
}

export interface Movie {
  id: number
  url: string
  judul: string
  cover: string
  lastch: string
  lastup: string
}

export const apiService = {
  // Fetch latest anime
  getLatestAnime: async (page: number = 1): Promise<Anime[]> => {
    try {
      await throttleRequest()
      const response = await axiosInstance.get(`${API_BASE}/latest`, {
        params: { page },
        timeout: 5000,
      })
      // Map response data and include status if available
      const data = response.data || MOCK_ANIME
      return Array.isArray(data) ? data : (data.data || MOCK_ANIME)
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after']
        if (retryAfter) {
          rateLimitRetryAfter = Date.now() + parseInt(retryAfter) * 1000
        } else {
          rateLimitRetryAfter = Date.now() + 90000 // 1.5 minute default on rate limit
        }
        console.log('📚 Using cached data - API is rate limited')
        return MOCK_ANIME
      }
      console.error('Error fetching latest anime:', error)
      // Fallback to mock data on any error
      return MOCK_ANIME
    }
  },

  // Fetch video data for an episode
  getVideoData: async (chapterUrlId: string, reso: string = '720p'): Promise<EpisodeResponse> => {
    // Check in-memory cache first
    const cacheKey = `${chapterUrlId}_${reso}`
    const cached = videoCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_1HOUR) {
      console.log('💾 Loading video from memory cache:', cacheKey)
      return cached.data
    }

    // Check localStorage
    const storageData = getFromStorage<EpisodeResponse>(`video_${cacheKey}`)
    if (storageData) {
      console.log('💾 Loading video from storage:', cacheKey)
      videoCache.set(cacheKey, { data: storageData, timestamp: Date.now() })
      return storageData
    }

    return retryWithBackoff(async () => {
      await throttleRequest()
      // Keep the 'p' in resolution (API expects '480p' not '480')
      const url = `${API_BASE}/getvideo?chapterUrlId=${chapterUrlId}&reso=${reso}`
      console.log('📹 Calling getvideo API:', url)
      
      const response = await axiosInstance.get(url, {
        timeout: 5000,
      })
      
      console.log('=== GETVIDEO RESPONSE ===')
      console.log(JSON.stringify(response.data, null, 2))
      console.log('========================')
      
      // Check if we have actual streams now
      if (response.data?.data?.[0]) {
        const episode = response.data.data[0]
        console.log('✓ Episode found')
        console.log('Streams:', episode.stream)
        console.log('Resolutions:', episode.reso)
      }
      
      // Cache the result in both memory and storage
      videoCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      })
      saveToStorage(`video_${cacheKey}`, response.data)
      
      return response.data
    })
  },

  // Fetch anime detail with all chapters
  getAnimeDetail: async (urlId: string): Promise<{ data: AnimeDetail[] }> => {
    // Check in-memory cache first
    const cached = detailCache.get(urlId)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_1HOUR) {
      console.log('💾 Loading detail from memory cache:', urlId)
      return cached.data
    }

    // Check localStorage
    const storageData = getFromStorage<{ data: AnimeDetail[] }>(`detail_${urlId}`)
    if (storageData) {
      console.log('💾 Loading detail from storage:', urlId)
      detailCache.set(urlId, { data: storageData, timestamp: Date.now() })
      return storageData
    }

    return retryWithBackoff(async () => {
      await throttleRequest()
      const response = await axiosInstance.get(`${API_BASE}/detail`, {
        params: {
          urlId,
        },
        timeout: 5000,
      })
      
      console.log('=== DETAIL API RESPONSE ===')
      console.log('Full detail response:', JSON.stringify(response.data, null, 2))
      if (response.data?.data?.[0]?.chapter?.[0]) {
        console.log('First chapter structure:', response.data.data[0].chapter[0])
      }
      console.log('========================')
      
      // Cache the result in both memory and storage
      detailCache.set(urlId, {
        data: response.data,
        timestamp: Date.now()
      })
      saveToStorage(`detail_${urlId}`, response.data)
      
      return response.data
    })
  },

  // Fetch all episodes for an anime
  getAnimeEpisodes: async (animeUrl: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE}/${animeUrl}`)
      return response.data
    } catch (error) {
      console.error('Error fetching anime episodes:', error)
      throw error
    }
  },

  // Search anime by query
  searchAnime: async (query: string, page: number = 1): Promise<SearchResult[]> => {
    try {
      await throttleRequest()
      const response = await axiosInstance.get<SearchResponse>(`${API_BASE}/search`, {
        params: { query, page },
        timeout: 5000,
      })
      
      // Extract results from nested data structure
      const searchData = response.data?.data?.[0]
      if (searchData?.result) {
        return searchData.result
      }
      return []
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after']
        if (retryAfter) {
          rateLimitRetryAfter = Date.now() + parseInt(retryAfter) * 1000
        } else {
          rateLimitRetryAfter = Date.now() + 60000
        }
        console.warn('Rate limited by search API')
      }
      console.error('Error searching anime:', error)
      return []
    }
  },

  // Fetch movies
  getMovies: async (): Promise<Movie[]> => {
    try {
      await throttleRequest()
      const response = await axiosInstance.get<Movie[]>(`${API_BASE}/movie`, {
        timeout: 5000,
      })
      return response.data || []
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after']
        if (retryAfter) {
          rateLimitRetryAfter = Date.now() + parseInt(retryAfter) * 1000
        } else {
          rateLimitRetryAfter = Date.now() + 60000
        }
        console.warn('Rate limited by movies API')
      }
      console.error('Error fetching movies:', error)
      return []
    }
  },

  // Fetch recommended anime
  getRecommended: async (page: number = 1): Promise<Anime[]> => {
    try {
      await throttleRequest()
      const response = await axiosInstance.get<Anime[]>(`${API_BASE}/recommended`, {
        params: { page },
        timeout: 5000,
      })
      return response.data || []
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after']
        if (retryAfter) {
          rateLimitRetryAfter = Date.now() + parseInt(retryAfter) * 1000
        } else {
          rateLimitRetryAfter = Date.now() + 60000
        }
        console.warn('Rate limited by recommended API')
      }
      console.error('Error fetching recommended anime:', error)
      return []
    }
  },
}

// Helper function to enrich anime with status data
export const enrichAnimeWithStatus = async (animeList: Anime[], limit: number = 3): Promise<Anime[]> => {
  if (!animeList || animeList.length === 0) return animeList
  
  const enriched = [...animeList]
  
  // Only enrich the first few items to avoid rate limiting
  for (let i = 0; i < Math.min(limit, enriched.length); i++) {
    if (!enriched[i].status) {
      try {
        // Add delay between enrichment calls to respect rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
        const detail = await apiService.getAnimeDetail(enriched[i].url)
        const animeDetail = detail.data?.[0]
        if (animeDetail?.status) {
          enriched[i].status = animeDetail.status
        }
      } catch (error) {
        // Skip if detail fetch fails
        console.log('Could not fetch status for:', enriched[i].judul)
      }
    }
  }
  
  return enriched
}
