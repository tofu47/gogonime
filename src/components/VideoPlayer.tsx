import { FC, useState, useRef, useEffect } from 'react'
import '../styles/VideoPlayer.css'

export interface VideoResolution {
  reso: string
  link?: string  // API uses 'link'
  url?: string   // Fallback to 'url'
  provider?: string
  id?: number
}

interface VideoPlayerProps {
  episodeId: number
  likeCount: number
  dislikeCount: number
  resolutions: string[]
  streamData: VideoResolution[]
  selectedReso: string
  allStreams: { [key: string]: VideoResolution[] }
  onResolutionChange: (reso: string) => void
  hasPrevEpisode?: boolean
  hasNextEpisode?: boolean
  onPrevEpisode?: () => void
  onNextEpisode?: () => void
}

const VideoPlayer: FC<VideoPlayerProps> = ({
  episodeId,
  likeCount,
  dislikeCount,
  resolutions,
  streamData,
  selectedReso,
  allStreams,
  onResolutionChange,
  hasPrevEpisode = false,
  hasNextEpisode = false,
  onPrevEpisode,
  onNextEpisode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [userLike, setUserLike] = useState(0)

  const handleResolutionChange = (reso: string) => {
    console.log('🎬 User switched to:', reso)
    onResolutionChange(reso)
  }

  const handleLike = () => {
    setUserLike(userLike === 1 ? 0 : 1)
  }

  const handleDislike = () => {
    setUserLike(userLike === -1 ? 0 : -1)
  }

  const handleVideoError = (e: any) => {
    const error = videoRef.current?.error
    let errorMsg = 'Unknown error'
    
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMsg = 'Video loading was aborted'
          break
        case error.MEDIA_ERR_NETWORK:
          errorMsg = 'Network error loading video'
          break
        case error.MEDIA_ERR_DECODE:
          errorMsg = 'Error decoding video'
          break
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMsg = 'Video format not supported'
          break
      }
    }
    
    console.error('Video error:', errorMsg, error)
    setVideoError(errorMsg)
  }

  // Get the video URL for the selected resolution
  const getStreamUrl = () => {
    // Try exact match first
    let stream = streamData.find((s) => s.reso === selectedReso)
    
    // If no exact match, try finding by resolution number
    if (!stream && streamData.length > 0) {
      const resoNum = selectedReso.replace('p', '')
      stream = streamData.find((s) => s.reso.includes(resoNum))
    }
    
    // Fallback to first available stream
    if (!stream && streamData.length > 0) {
      console.warn(`No stream found for resolution ${selectedReso}, using first available: ${streamData[0].reso}`)
      stream = streamData[0]
    }
    
    if (!stream) {
      console.error('No video streams available', {
        selectedReso,
        streamData,
        resolutions,
      })
    }
    
    // Return link (API uses 'link') or url (fallback)
    return stream?.link || stream?.url || null
  }

  const streamUrl = getStreamUrl()
  const hasStreams = streamData && streamData.length > 0

  useEffect(() => {
    // Clear error when stream URL changes
    setVideoError(null)
    setIsLoading(true)
    // Force video element to reload the new source
    if (videoRef.current) {
      videoRef.current.src = streamUrl || ''
      if (streamUrl) {
        videoRef.current.play().catch(e => console.warn('Auto-play prevented:', e))
      }
    }
  }, [streamUrl])

  return (
    <div className="video-player-container">
      {/* Placeholder while loading */}
      {isLoading && (
        <div className="video-placeholder-loading">
          <div className="spinner"></div>
          <p>Loading video...</p>
        </div>
      )}
      
      {streamUrl ? (
        <video 
          ref={videoRef}
          className="video-element" 
          controls 
          width="100%" 
          height="auto"
          onError={handleVideoError}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          controlsList="nodownload"
        >
          <source src={streamUrl} type="video/mp4" />
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="video-placeholder">
          <div className="video-info">
            <h3>Episode {episodeId}</h3>
            {hasStreams ? (
              <p>No stream URL found. Available: {streamData.map(s => s.reso).join(', ')}</p>
            ) : (
              <p>No video streams available</p>
            )}
          </div>
        </div>
      )}
      
      {videoError && (
        <div className="video-error-message">
          <p>⚠️ {videoError}</p>
        </div>
      )}

      <div className="player-controls">
        <div className="resolution-selector">
          <label>Quality:</label>
          {['360p', '480p', '720p', '1080p'].map((reso) => {
            const hasSource = allStreams[reso] && allStreams[reso].length > 0
            return (
              hasSource && (
                <button 
                  key={reso}
                  className={`quality-btn ${selectedReso === reso ? 'active' : ''}`}
                  onClick={() => handleResolutionChange(reso)}
                >
                  {reso}
                </button>
              )
            )
          })}
        </div>

        <div className="episode-nav-buttons">
          <button 
            className="nav-btn prev-btn"
            onClick={onPrevEpisode}
            disabled={!hasPrevEpisode}
          >
            ← Previous
          </button>
          <button 
            className="nav-btn next-btn"
            onClick={onNextEpisode}
            disabled={!hasNextEpisode}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
