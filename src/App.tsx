import { useState, useEffect } from 'react'
import { apiService, Anime, enrichAnimeWithStatus } from './services/apiService'
import AnimeCard from './components/AnimeCard'
import AnimeDetailPage from './components/AnimeDetailPage'
import EpisodePage from './components/EpisodePage'
import SearchPage from './components/SearchPage'
import MoviePage from './components/MoviePage'
import RecommendedPage from './components/RecommendedPage'
import './App.css'

type ViewType = 'list' | 'detail' | 'episode' | 'search' | 'movies' | 'recommended'

interface DetailViewState {
  urlId: string
}

interface EpisodeViewState {
  chapterUrlId: string
  chapterNumber: string
  animeTitle?: string
  allChapters?: { ch: string; url: string; date: string }[]
  currentChapterIndex?: number
}

// Cache for home page data
interface CacheData {
  latest: Anime[]
  recommended: Anime[]
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let homePageCache: CacheData | null = null

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('list')
  const [detailState, setDetailState] = useState<DetailViewState | null>(null)
  const [episodeState, setEpisodeState] = useState<EpisodeViewState | null>(null)
  const [latestAnime, setLatestAnime] = useState<Anime[]>([])
  const [recommendedAnime, setRecommendedAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [latestPage, setLatestPage] = useState(1)
  const [recommendedPage, setRecommendedPage] = useState(1)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setLoading(true)
        
        // Check cache first
        const now = Date.now()
        if (homePageCache && (now - homePageCache.timestamp) < CACHE_DURATION) {
          console.log('📦 Loading from cache (latest)')
          setLatestAnime(homePageCache.latest)
          setError(null)
          setLoading(false)
          return
        }
        
        let data = await apiService.getLatestAnime(latestPage)
        // Skip enrichment due to heavy rate limiting - use mock data which has status
        setLatestAnime(data)
        
        // Update cache
        if (homePageCache) {
          homePageCache.latest = data
          homePageCache.timestamp = now
        }
        
        setError(null)
      } catch (err) {
        setError('Failed to fetch anime data. The API may be rate-limited. Try again in a moment.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLatest()
  }, [latestPage])

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        // Check cache first
        const now = Date.now()
        if (homePageCache && (now - homePageCache.timestamp) < CACHE_DURATION) {
          console.log('📦 Loading from cache (recommended)')
          setRecommendedAnime(homePageCache.recommended)
          return
        }
        
        let data = await apiService.getRecommended(recommendedPage)
        // Skip enrichment due to heavy rate limiting - use mock data which has status
        setRecommendedAnime(data)
        
        // Update cache
        if (!homePageCache) {
          homePageCache = {
            latest: latestAnime,
            recommended: data,
            timestamp: now
          }
        } else {
          homePageCache.recommended = data
          homePageCache.timestamp = now
        }
      } catch (err) {
        console.error('Error fetching recommended:', err)
      }
    }
    fetchRecommended()
  }, [recommendedPage])

  const handleViewDetail = (urlId: string) => {
    setDetailState({ urlId })
    setCurrentView('detail')
  }

  const handleWatchEpisode = (chapterUrlId: string, chapterNumber: string, allChapters?: { ch: string; url: string; date: string }[], currentIndex?: number, animeTitle?: string) => {
    // Use the provided index directly - it's already correct from navigation
    setEpisodeState({ chapterUrlId, chapterNumber, animeTitle, allChapters, currentChapterIndex: currentIndex ?? 0 })
    setCurrentView('episode')
  }

  const handleDirectWatch = (chapterUrlId: string, chapterNumber: string) => {
    setEpisodeState({ chapterUrlId, animeTitle: chapterNumber })
    setCurrentView('episode')
  }

  const handleBackToDetail = () => {
    setCurrentView('detail')
    setEpisodeState(null)
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setDetailState(null)
    setEpisodeState(null)
  }

  const handleSearchAnime = (urlId: string) => {
    setDetailState({ urlId })
    setCurrentView('detail')
  }

  const handleViewSearch = () => {
    setCurrentView('search')
  }

  const handleViewMovies = () => {
    setCurrentView('movies')
  }

  const handleMovieSelect = (urlId: string, title: string) => {
    setDetailState({ urlId })
    setCurrentView('detail')
  }

  const handleViewRecommended = () => {
    setCurrentView('recommended')
  }

  const handleSearchInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const searchValue = (e.target as HTMLInputElement).value.trim()
      if (searchValue) {
        handleViewSearch()
      }
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <h1>OTAKU<span>DESU</span></h1>
        </div>
        <nav className="header-nav">
          <button 
            className={`nav-link ${currentView === 'list' ? 'active' : ''}`}
            onClick={handleBackToList}
          >
            HOME
          </button>
          <button 
            className={`nav-link ${currentView === 'search' ? 'active' : ''}`}
            onClick={handleViewSearch}
          >
            ANIME LIST
          </button>
          <button 
            className={`nav-link ${currentView === 'recommended' ? 'active' : ''}`}
            onClick={handleViewRecommended}
          >
            RECOMMENDED
          </button>
          <button 
            className={`nav-link ${currentView === 'movies' ? 'active' : ''}`}
            onClick={handleViewMovies}
          >
            GENRE LIST
          </button>
        </nav>
        <div className="header-search">
          <input 
            type="text" 
            placeholder="Search Anime ..." 
            onKeyPress={handleSearchInput}
          />
        </div>
      </header>

      <main className="container">
        {currentView === 'list' ? (
          <>
            {loading && <div className="loading">Loading anime...</div>}
            {error && <div className="error">{error}</div>}

            {!loading && !error && (
              <>
                <div className="carousel-section">
                  <div className="section-header">
                    <h2 className="section-title">On-going Anime</h2>
                    <button className="see-more-btn" onClick={handleViewSearch}>CEK ANIME ON-GOING LAINNYA</button>
                  </div>
                  <div className="anime-grid">
                    {latestAnime.filter(item => !item.status || item.status?.toLowerCase() === 'ongoing').slice(0, 25).map((item) => (
                      <AnimeCard
                        key={item.id}
                        anime={item}
                        onWatch={() => handleViewDetail(item.url)}
                      />
                    ))}
                  </div>
                </div>

                <div className="carousel-section">
                  <div className="section-header">
                    <h2 className="section-title">Recommended</h2>
                    <button className="see-more-btn" onClick={handleViewRecommended}>CEK REKOMENDASI LAINNYA</button>
                  </div>
                  <div className="anime-grid">
                    {recommendedAnime.slice(0, 25).map((item) => (
                      <AnimeCard
                        key={item.id}
                        anime={item}
                        onWatch={() => handleViewDetail(item.url)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : currentView === 'search' ? (
          <SearchPage onAnimeSelect={handleSearchAnime} />
        ) : currentView === 'recommended' ? (
          <RecommendedPage onAnimeSelect={handleSearchAnime} />
        ) : currentView === 'movies' ? (
          <MoviePage onMovieSelect={handleMovieSelect} />
        ) : currentView === 'detail' ? (
          detailState && (
            <AnimeDetailPage
              urlId={detailState.urlId}
              onWatch={handleWatchEpisode}
              onBack={handleBackToList}
            />
          )
        ) : (
          episodeState && (
            <EpisodePage
              chapterUrlId={episodeState.chapterUrlId}
              episodeNumber={episodeState.chapterNumber}
              animeTitle={episodeState.animeTitle}
              onBack={handleBackToDetail}
              allChapters={episodeState.allChapters}
              currentChapterIndex={episodeState.currentChapterIndex}
              onNextEpisode={handleWatchEpisode}
            />
          )
        )}
      </main>
    </div>
  )
}

export default App
