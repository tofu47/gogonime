import { FC } from 'react'
import '../styles/AnimeCard.css'

interface AnimeProps {
  id: number
  url: string
  judul: string
  cover: string
  lastch: string
  lastup: string
}

interface CardProps {
  anime: AnimeProps
  onWatch?: () => void
}

const AnimeCard: FC<CardProps> = ({ anime, onWatch }) => {
  return (
    <div className="anime-card">
      <div className="anime-card-image">
        <img src={anime.cover} alt={anime.judul} loading="lazy" />
        <div className="anime-card-overlay">
          <button className="watch-btn" onClick={onWatch} aria-label="Play">
          </button>
        </div>
      </div>
      <div className="anime-card-info">
        <h3>{anime.judul}</h3>
        <p className="last-chapter">{anime.lastch}</p>
        <p className="last-update">{anime.lastup}</p>
      </div>
    </div>
  )
}

export default AnimeCard
