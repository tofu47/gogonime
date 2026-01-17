import { FC, useState, useRef } from 'react'
import { apiService, SearchResult } from '../services/apiService'
import '../styles/SearchPage.css'

interface SearchPageProps {
  onAnimeSelect: (urlId: string) => void
}

const SearchPage: FC<SearchPageProps> = ({ onAnimeSelect }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [nextPageData, setNextPageData] = useState<SearchResult[] | null>(null)
  const [prevPageData, setPrevPageData] = useState<SearchResult[] | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)
    setCurrentPage(1)
    try {
      const searchResults = await apiService.searchAnime(query, 1)
      setResults(searchResults)
      // Preload next page in background
      setTimeout(() => {
        apiService.searchAnime(query, 2).then(nextResults => {
          if (nextResults.length > 0) setNextPageData(nextResults)
        }).catch(() => {})
      }, 500)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleNextPage = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      // Use preloaded data if available
      let searchResults = nextPageData
      if (!searchResults) {
        searchResults = await apiService.searchAnime(query, currentPage + 1)
      }
      if (searchResults && searchResults.length > 0) {
        setResults(searchResults)
        setPrevPageData(results)
        setCurrentPage(currentPage + 1)
        // Preload next next page
        setTimeout(() => {
          apiService.searchAnime(query, currentPage + 2).then(nextResults => {
            if (nextResults.length > 0) setNextPageData(nextResults)
          }).catch(() => {})
        }, 500)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      setNextPageData(null)
    } catch (error) {
      console.error('Pagination error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousPage = async () => {
    if (currentPage <= 1 || !query.trim()) return
    setLoading(true)
    try {
      // Use preloaded data if available
      let searchResults = prevPageData
      if (!searchResults) {
        searchResults = await apiService.searchAnime(query, currentPage - 1)
      }
      if (searchResults) {
        setResults(searchResults)
        setNextPageData(results)
        setCurrentPage(currentPage - 1)
        // Preload previous previous page
        if (currentPage > 2) {
          setTimeout(() => {
            apiService.searchAnime(query, currentPage - 2).then(prevResults => {
              if (prevResults.length > 0) setPrevPageData(prevResults)
            }).catch(() => {})
          }, 500)
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      setPrevPageData(null)
    } catch (error) {
      console.error('Pagination error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="search-page">
      <div className="search-container">
        <h1>Search Anime</h1>
        <form onSubmit={handleSearch} className="search-form">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime..."
            className="search-input"
          />
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="search-loading">
          <p>Searching for "{query}"...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="search-no-results">
          <p>No results found for "{query}"</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          <h2 className="results-title">Search Results</h2>
          <div className="results-grid">
            {results.map((anime) => (
              <div
                key={anime.id}
                className="anime-result-card"
                onClick={() => onAnimeSelect(anime.url)}
              >
                <div className="result-cover">
                  <img
                    src={anime.cover}
                    alt={anime.judul}
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/200x300?text=No+Image'
                    }}
                  />
                  <div className="result-overlay">
                    <div className="result-info">
                      <p className="result-score">⭐ {anime.score}</p>
                      <p className="result-status">{anime.status}</p>
                      <p className="result-episodes">{anime.total_episode} eps</p>
                    </div>
                  </div>
                </div>
                <div className="result-details">
                  <h3 className="result-title">{anime.judul}</h3>
                  <p className="result-studio">{anime.studio}</p>
                  <div className="result-genres">
                    {anime.genre.slice(0, 3).map((gen, idx) => (
                      <span key={idx} className="result-genre">
                        {gen}
                      </span>
                    ))}
                  </div>
                  <p className="result-synopsis">
                    {anime.sinopsis.substring(0, 100)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            <span className="page-indicator">Page {currentPage}</span>
            <button 
              className="pagination-btn"
              onClick={handleNextPage}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchPage
