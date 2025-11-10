import React, { useEffect, useState } from 'react'
import { getRecommendations, getPlaylists, createPlaylist, rateEpisode, getRecommendedPlaylists, augmentFromSpotify, buildAiEmbeddings, deletePlaylistApi } from '../api/client'
import EpisodeCard from '../components/EpisodeCard'
import PlaylistPanel from '../components/PlaylistPanel'

export default function Home() {
  const [recs, setRecs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(false)
  const [recPlaylists, setRecPlaylists] = useState([])

  useEffect(() => { refreshAll() }, [])

  const [interests, setInterests] = useState(() => {
    try { return (localStorage.getItem('interests') || '').split(',').map(s=>s.trim()).filter(Boolean) } catch { return [] }
  })
  const [interestsInput, setInterestsInput] = useState(() => (interests.join(', ')))

  async function refreshAll() {
    setLoading(true)
    let r1 = await getRecommendations(20, { source: 'spotify', interests })
    // Fallbacks: if Spotify-only yields nothing, try without Spotify filter, then with no interests
    if (!r1 || r1.length === 0) {
      r1 = await getRecommendations(20, { interests })
      if (!r1 || r1.length === 0) {
        r1 = await getRecommendations(20)
      }
    }
    const [r2, r3] = await Promise.all([ getPlaylists(), getRecommendedPlaylists() ])
    setRecs(r1); setPlaylists(r2); setRecPlaylists(r3); setLoading(false)
  }

  function onSaveInterests() {
    const arr = (interestsInput || '').split(',').map(s=>s.trim()).filter(Boolean)
    setInterests(arr)
    try { localStorage.setItem('interests', arr.join(',')) } catch {}
    refreshAll()
  }

  async function onCreatePlaylist(name) {
    const playlist = await createPlaylist(name)
    setPlaylists(prev => [...prev, playlist])
  }
  async function onDeletePlaylist(playlistId) {
    const updated = await deletePlaylistApi(playlistId)
    setPlaylists(updated)
  }
  async function onRate(episodeId, score) {
    await rateEpisode(episodeId, score)
    const r = await getRecommendations(); setRecs(r)
  }

  return (
    <div>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <main>
          <h3>AI Picks (Web & Spotify)</h3>
          <div className="row" style={{ margin: '8px 0 12px 0' }}>
            <input className="input" value={interestsInput} onChange={e=>setInterestsInput(e.target.value)} placeholder="Interests (comma separated, e.g. ai, cloud, health)" />
            <button className="btn" onClick={onSaveInterests}>Save interests</button>
          </div>
          {loading && <div className="muted">Loading…</div>}
          {!loading && (
            <div className="grid-cards">
              {recs.map((e) => (
                <EpisodeCard key={e.id} episode={e} onRate={onRate} />
              ))}
            </div>
          )}
        </main>
        <aside>
          <PlaylistPanel playlists={playlists} onCreate={onCreatePlaylist} onDelete={onDeletePlaylist} />
        </aside>
      </div>
    </div>
  )
}


