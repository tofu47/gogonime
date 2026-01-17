import { FC, useState, useEffect } from 'react'
import { apiService, Episode, VideoResolution } from '../services/apiService'
import VideoPlayer from './VideoPlayer'
import '../styles/EpisodePage.css'

interface EpisodePageProps {
  chapterUrlId: string
  episodeNumber: string
  animeTitle?: string
  onBack: () => void
  allChapters?: { ch: string; url: string; date: string }[]
  currentChapterIndex?: number
  onNextEpisode?: (chapterUrl: string, chapterNumber: string, allChapters?: { ch: string; url: string; date: string }[], currentIndex?: number, animeTitle?: string) => void
}

const EpisodePage: FC<EpisodePageProps> = ({ chapterUrlId, episodeNumber, animeTitle, onBack, allChapters = [], currentChapterIndex = 0, onNextEpisode }) => {
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReso, setSelectedReso] = useState('720p')
  const [allStreams, setAllStreams] = useState<{ [key: string]: VideoResolution[] }>({})

  const hasNextEpisode = currentChapterIndex < allChapters.length - 1
  const hasPrevEpisode = currentChapterIndex > 0
  const nextChapter = hasNextEpisode ? allChapters[currentChapterIndex + 1] : null
  const prevChapter = hasPrevEpisode ? allChapters[currentChapterIndex - 1] : null

  const handleNextEpisode = () => {
    if (nextChapter && onNextEpisode) {
      onNextEpisode(nextChapter.url, nextChapter.ch, allChapters, currentChapterIndex + 1)
    }
  }

  const handlePrevEpisode = () => {
    if (prevChapter && onNextEpisode) {
      onNextEpisode(prevChapter.url, prevChapter.ch, allChapters, currentChapterIndex - 1)
    }
  }

  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        setLoading(true)
        console.log('📹 Fetching episode data for selected resolution:', selectedReso)
        
        // Only fetch the selected resolution initially
        const response = await apiService.getVideoData(chapterUrlId, selectedReso)
        
        if (response.data && response.data.length > 0) {
          const episodeData = response.data[0]
          console.log('✓ Episode loaded')
          console.log(`${selectedReso} streams:`, response.data[0].stream)
          
          // Store streams by resolution
          setAllStreams(prev => ({
            ...prev,
            [selectedReso]: response.data[0].stream || [],
          }))
          
          setEpisode(episodeData)
          setError(null)
          
          // Lazy load other resolutions in background
          const otherReso = selectedReso === '720p' ? '480p' : '720p'
          console.log('⏳ Preloading other resolution:', otherReso)
          setTimeout(async () => {
            try {
              const otherResponse = await apiService.getVideoData(chapterUrlId, otherReso)
              if (otherResponse.data && otherResponse.data.length > 0) {
                console.log(`✓ ${otherReso} preloaded`)
                setAllStreams(prev => ({
                  ...prev,
                  [otherReso]: otherResponse.data[0].stream || [],
                }))
              }
            } catch (err) {
              console.warn(`Failed to preload ${otherReso}:`, err)
            }
          }, 1000)
        } else {
          setError('No episode data found')
        }
      } catch (err) {
        setError('Failed to load episode data')
        console.error('Episode fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEpisodeData()
  }, [chapterUrlId])

  const handleResolutionChange = (reso: string) => {
    console.log('📺 Switching to resolution:', reso)
    setSelectedReso(reso)
  }

  return (
    <div className="episode-page">
      <div className="episode-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>{animeTitle || 'Episode'}</h1>
        <span className="episode-number">Episode {episodeNumber}</span>
      </div>

      {loading && <div className="loading">Loading episode...</div>}
      {error && (
        <div className="error">
          {error}
          {error.includes('429') && <p>The API is rate limited. Please wait a moment and try again.</p>}
        </div>
      )}

      {!loading && !error && episode && (
        <>
          <VideoPlayer
            episodeId={episode.episode_id}
            likeCount={episode.likeCount}
            dislikeCount={episode.dislikeCount}
            resolutions={episode.reso}
            streamData={allStreams[selectedReso] || episode.stream}
            selectedReso={selectedReso}
            allStreams={allStreams}
            onResolutionChange={handleResolutionChange}
            hasPrevEpisode={hasPrevEpisode}
            hasNextEpisode={hasNextEpisode}
            onPrevEpisode={handlePrevEpisode}
            onNextEpisode={handleNextEpisode}
          />

          <div className="episode-stats">
            <div className="stat-item">
              <span className="stat-label">Available Resolutions:</span>
              <span className="stat-value">
                {['360p', '480p', '720p', '1080p']
                  .filter(reso => allStreams[reso] && allStreams[reso].length > 0)
                  .join(', ')}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default EpisodePage
