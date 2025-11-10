import React from 'react'
import RatingStars from './RatingStars'
import { Link } from 'react-router-dom'

export default function EpisodeCard({ episode, podcast, onRate }) {
  if (!episode && podcast) {
    return (
      <div className="card">
        <div style={{ fontWeight: 600 }}>{podcast.title}</div>
        <div className="muted">{podcast.description}</div>
        <div className="tag-row">{(podcast.tags || []).map(t => <span key={t} className="tag">{t}</span>)}</div>
      </div>
    )
  }

  if (!episode) return null
  return (
    <div className="card">
      {episode.externalUrl && episode.externalUrl.includes('spotify.com') && (
        <div style={{ background: 'linear-gradient(135deg, #1DB954 0%, #191414 100%)', padding: 12, borderRadius: 8, marginBottom: 8, color: 'white', textAlign: 'center' }}>
          <span style={{ fontSize: 24 }}>♪</span> <span style={{ fontWeight: 600 }}>Spotify</span>
        </div>
      )}
      <div style={{ fontWeight: 600 }}>{episode.title}</div>
      {episode.podcastTitle && <div className="muted">{episode.podcastTitle}</div>}
      <div className="muted">{episode.description}</div>
      <div className="tag-row">{(episode.tags || []).map(t => <span key={t} className="tag">{t}</span>)}</div>
      <div className="row" style={{ marginTop: 8, alignItems: 'center' }}>
        <Link className="btn" to={`/player/${episode.id}`}>{episode.externalUrl && !episode.audioUrl ? 'Play on Spotify' : 'Play'}</Link>
        {episode.externalUrl && !episode.audioUrl && (
          <a className="btn" href={episode.externalUrl} target="_blank" rel="noreferrer">Open on Spotify</a>
        )}
        <RatingStars onRate={(s) => onRate && onRate(episode.id, s)} />
      </div>
    </div>
  )
}



