import React, { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getEpisodeByIdApi, getPlaybackPosition, savePlaybackPosition, listReviews, addReview, recordPlay } from '../api/client'

export default function Player() {
  const { episodeId } = useParams()
  const [episode, setEpisode] = useState(null)
  const [position, setPosition] = useState(0)
  const [reviews, setReviews] = useState([])
  const [text, setText] = useState('')
  const audioRef = useRef(null)
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const queue = (searchParams.get('queue') || '').split(',').filter(Boolean)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    (async () => {
      const ep = await getEpisodeByIdApi(episodeId)
      setEpisode(ep)
      const p = await getPlaybackPosition(episodeId)
      setPosition(p)
      const rv = await listReviews(episodeId)
      setReviews(rv)
      try { await recordPlay(episodeId) } catch {}
      if (queue.length) {
        const idx = queue.findIndex(id => id === episodeId)
        setCurrentIndex(idx >= 0 ? idx : 0)
      }
    })()
  }, [episodeId])

  useEffect(() => {
    if (audioRef.current && position > 0) {
      audioRef.current.currentTime = position
    }
  }, [position])

  function onTimeUpdate() {
    const current = Math.floor(audioRef.current?.currentTime || 0)
    setPosition(current)
  }

  useEffect(() => {
    const id = setInterval(() => {
      if (episode) savePlaybackPosition(episode.id, position)
    }, 2000)
    return () => clearInterval(id)
  }, [episode, position])

  function nextInQueue() {
    if (!queue.length) return
    const nextIdx = currentIndex + 1
    if (nextIdx < queue.length) {
      const nextId = queue[nextIdx]
      nav(`/player/${nextId}?queue=${encodeURIComponent(queue.join(','))}`)
    }
  }

  function prevInQueue() {
    if (!queue.length) return
    const prevIdx = currentIndex - 1
    if (prevIdx >= 0) {
      const prevId = queue[prevIdx]
      nav(`/player/${prevId}?queue=${encodeURIComponent(queue.join(','))}`)
    }
  }

  if (!episode) return <div>Loading…</div>
  return (
    <div>
      <h3>{episode.title}</h3>
      <div className="muted">{episode.podcastTitle}</div>
      {episode.audioUrl ? (
        <audio ref={audioRef} src={episode.audioUrl} controls onTimeUpdate={onTimeUpdate} onEnded={nextInQueue} />
      ) : (
        <div>
          {episode.externalUrl && episode.externalUrl.includes('spotify.com') ? (
            <div>
              {(() => {
                // Extract Spotify ID from URL (episode or show)
                let spotifyId = episode.spotifyId;
                let isShow = episode.isShow || false;
                
                if (!spotifyId && episode.externalUrl) {
                  // Try to extract episode ID
                  const episodeMatch = episode.externalUrl.match(/episode\/([a-zA-Z0-9]+)/);
                  if (episodeMatch) {
                    spotifyId = episodeMatch[1];
                  } else {
                    // Try to extract show ID
                    const showMatch = episode.externalUrl.match(/show\/([a-zA-Z0-9]+)/);
                    if (showMatch) {
                      spotifyId = showMatch[1];
                      isShow = true;
                    } else {
                      // Fallback: try splitting by / and getting last part before ?
                      const parts = episode.externalUrl.split('/');
                      const lastPart = parts[parts.length - 1];
                      spotifyId = lastPart.split('?')[0];
                    }
                  }
                }
                
                // Check if it's a show URL
                if (!isShow && episode.externalUrl && episode.externalUrl.includes('/show/')) {
                  isShow = true;
                }
                
                if (spotifyId) {
                  const embedType = isShow ? 'show' : 'episode';
                  return (
                    <iframe
                      title="Spotify Player"
                      src={`https://open.spotify.com/embed/${embedType}/${spotifyId}?utm_source=generator`}
                      width="100%"
                      height={isShow ? "352" : "232"}
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      style={{ borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,.25)' }}
                    />
                  );
                }
                return (
                  <div className="row">
                    <a className="btn" href={episode.externalUrl} target="_blank" rel="noreferrer">Open on Spotify</a>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="row">
              <a className="btn" href={episode.externalUrl} target="_blank" rel="noreferrer">Open Source</a>
            </div>
          )}
          {queue.length > 0 && (
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn" onClick={prevInQueue} disabled={currentIndex <= 0}>◀ Prev</button>
              <button className="btn" onClick={nextInQueue}>Next ▶</button>
            </div>
          )}
        </div>
      )}
      {queue.length > 0 && (
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn ghost" onClick={prevInQueue} disabled={currentIndex <= 0}>◀ Prev</button>
          <div className="muted" style={{ fontSize: 12 }}>Track {currentIndex + 1} of {queue.length}</div>
          <button className="btn" onClick={nextInQueue} disabled={currentIndex >= queue.length - 1}>Next ▶</button>
        </div>
      )}
      <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Resumes at {position}s</div>
      <div style={{ marginTop: 24 }}>
        <h4>Reviews</h4>
        <form onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; const r = await addReview(episode.id, text.trim()); setReviews(prev => prev.concat([r])); setText('') }}>
          <div className="row">
            <input className="input" value={text} onChange={e => setText(e.target.value)} placeholder="Write a review" style={{ flex: 1 }} />
            <button className="btn" type="submit">Post</button>
          </div>
        </form>
        <ul>
          {reviews.map((r, i) => (
            <li key={i} style={{ marginTop: 6 }}>{r.text}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}


