import { useState, useEffect } from 'react'
import { apiService, AnimeDetail, Chapter } from '../services/apiService'
import '../styles/AnimeDetailPage.css'

interface AnimeDetailPageProps {
  urlId: string
  onWatch: (chapterUrl: string, chapterNumber: string, allChapters?: { ch: string; url: string; date: string }[], currentIndex?: number, animeTitle?: string) => void
  onBack: () => void
}

export default function AnimeDetailPage({ urlId, onWatch, onBack }: AnimeDetailPageProps) {
  const [animeDetail, setAnimeDetail] = useState<AnimeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getAnimeDetail(urlId)
        if (response.data && response.data.length > 0) {
          setAnimeDetail(response.data[0])
        } else {
          setError('No anime data found')
        }
      } catch (err) {
        setError('Failed to load anime details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [urlId])

  if (loading) {
    return (
      <div className="anime-detail-container loading">
        <div className="loader"></div>
        <p>Loading anime details...</p>
      </div>
    )
  }

  if (error || !animeDetail) {
    return (
      <div className="anime-detail-container error">
        <h2>{error || 'Failed to load anime'}</h2>
        <button onClick={onBack} className="back-btn">
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="anime-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button onClick={onBack} className="back-btn">
          ← Back to List
        </button>
        <h1 className="detail-title">{animeDetail.judul}</h1>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        {/* Left Section - Cover & Info */}
        <div className="detail-left">
          <img src={animeDetail.cover} alt={animeDetail.judul} className="detail-cover" />
          <div className="detail-info">
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value">{animeDetail.status}</span>
            </div>
            <div className="info-item">
              <span className="label">Type:</span>
              <span className="value">{animeDetail.type}</span>
            </div>
            <div className="info-item">
              <span className="label">Rating:</span>
              <span className="value">{animeDetail.rating}/10</span>
            </div>
            <div className="info-item">
              <span className="label">Published:</span>
              <span className="value">{animeDetail.published}</span>
            </div>
            <div className="info-item">
              <span className="label">Studio:</span>
              <span className="value">{animeDetail.author}</span>
            </div>
            <div className="info-item">
              <span className="label">Total Chapters:</span>
              <span className="value">{animeDetail.chapter.length}</span>
            </div>
          </div>
        </div>

        {/* Right Section - Genres & Episodes */}
        <div className="detail-right">
          <div className="genres-section">
            <h3>Genres</h3>
            <div className="genres">
              {animeDetail.genre.map((g, idx) => (
                <span key={idx} className="genre-tag">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Chapter List */}
          <div className="chapters-section">
            <h3>Episodes ({animeDetail.chapter.length})</h3>
            <div className="chapters-grid">
              {[...animeDetail.chapter].reverse().map((chapter, idx) => {
                const actualIndex = animeDetail.chapter.length - 1 - idx
                const reversedChapters = [...animeDetail.chapter].reverse()
                return (
                  <button
                    key={chapter.id}
                    className="chapter-item"
                    onClick={() => onWatch(chapter.url, chapter.ch, reversedChapters, idx, animeDetail.judul)}
                    title={`Ch ${chapter.ch} - ${chapter.date}`}
                  >
                    <span className="chapter-number">Ch {chapter.ch}</span>
                    <span className="chapter-date-small">{chapter.date}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
