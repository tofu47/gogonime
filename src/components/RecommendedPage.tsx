import { FC, useState, useEffect } from 'react'
import { apiService, Anime } from '../services/apiService'
import AnimeCard from './AnimeCard'
import '../styles/RecommendedPage.css'

interface RecommendedPageProps {
  onAnimeSelect: (urlId: string) => void
}

const RecommendedPage: FC<RecommendedPageProps> = ({ onAnimeSelect }) => {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [nextPageData, setNextPageData] = useState<Anime[] | null>(null)
  const [prevPageData, setPrevPageData] = useState<Anime[] | null>(null)

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        setLoading(true)
        const data = await apiService.getRecommended(currentPage)
        setAnime(data)
        setError(null)
        // Preload next page in background
        setTimeout(() => {
          apiService.getRecommended(currentPage + 1).then(nextData => {
            if (nextData.length > 0) setNextPageData(nextData)
          }).catch(() => {})
        }, 300)
      } catch (err) {
        setError('Failed to load recommended anime')
        console.error('Recommended fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommended()
  }, [currentPage])

  const handleNextPage = () => {
    // Use preloaded data if available
    if (nextPageData && nextPageData.length > 0) {
      setAnime(nextPageData)
      setPrevPageData(anime)
      setCurrentPage(currentPage + 1)
      // Preload next next page
      setTimeout(() => {
        apiService.getRecommended(currentPage + 2).then(nextData => {
          if (nextData.length > 0) setNextPageData(nextData)
        }).catch(() => {})
      }, 300)
      setNextPageData(null)
    } else {
      setCurrentPage(currentPage + 1)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      // Use preloaded data if available
      if (prevPageData && prevPageData.length > 0) {
        setAnime(prevPageData)
        setNextPageData(anime)
        setCurrentPage(currentPage - 1)
        // Preload previous previous page
        if (currentPage > 2) {
          setTimeout(() => {
            apiService.getRecommended(currentPage - 2).then(prevData => {
              if (prevData.length > 0) setPrevPageData(prevData)
            }).catch(() => {})
          }, 300)
        }
        setPrevPageData(null)
      } else {
        setCurrentPage(currentPage - 1)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="recommended-page">
      <div className="recommended-header">
        <h1>✨ Recommended for You</h1>
        <p>Handpicked anime recommendations</p>
      </div>

      {loading && <div className="loading">Loading recommendations...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && anime.length > 0 && (
        <>
          <div className="pagination-top">
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

          <div className="anime-grid">
            {anime.map((item) => (
              <AnimeCard
                key={item.id}
                anime={item}
                onWatch={() => onAnimeSelect(item.url)}
              />
            ))}
          </div>

          <div className="pagination-bottom">
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
        </>
      )}

      {!loading && anime.length === 0 && !error && (
        <div className="no-anime">
          <p>No recommendations found</p>
        </div>
      )}
    </div>
  )
}

export default RecommendedPage
