import { FC, useState, useEffect } from 'react'
import { apiService, Movie } from '../services/apiService'
import '../styles/MoviePage.css'

interface MoviePageProps {
  onMovieSelect: (urlId: string, title: string) => void
}

const MoviePage: FC<MoviePageProps> = ({ onMovieSelect }) => {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)
        const data = await apiService.getMovies()
        setMovies(data)
        setError(null)
      } catch (err) {
        setError('Failed to load movies')
        console.error('Movies fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  return (
    <div className="movie-page">
      <div className="movie-header">
        <h1>🎬 Anime Movies</h1>
        <p>Latest anime movies collection</p>
      </div>

      {loading && <div className="loading">Loading movies...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && movies.length > 0 && (
        <div className="movies-container">
          <div className="movies-grid">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="movie-card"
                onClick={() => onMovieSelect(movie.url, movie.judul)}
              >
                <div className="movie-cover">
                  <img
                    src={movie.cover}
                    alt={movie.judul}
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/200x300?text=No+Image'
                    }}
                  />
                  <div className="movie-overlay">
                    <button className="play-btn">▶ Watch</button>
                  </div>
                </div>
                <div className="movie-info">
                  <h3>{movie.judul}</h3>
                  <p className="movie-status">{movie.lastup}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && movies.length === 0 && !error && (
        <div className="no-movies">
          <p>No movies found</p>
        </div>
      )}
    </div>
  )
}

export default MoviePage
