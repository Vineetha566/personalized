import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlaylists, createPlaylist, deletePlaylistApi } from '../api/client'

export default function Playlists() {
  const [playlists, setPlaylists] = useState([])
  const nav = useNavigate()
  const [name, setName] = useState('')

  useEffect(() => { (async () => setPlaylists(await getPlaylists()))() }, [])

  async function onCreate() {
    if (!name.trim()) return
    const p = await createPlaylist(name.trim())
    setPlaylists(prev => [...prev, p])
    setName('')
  }

  async function onDelete(playlistId) {
    const updated = await deletePlaylistApi(playlistId)
    setPlaylists(updated)
  }


  return (
    <div>
      <h3>Your Playlists</h3>
      <div className="row" style={{ marginBottom: 8 }}>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="New playlist name" />
        <button className="btn" onClick={onCreate}>Create</button>
      </div>
      <div className="grid">
        {playlists.map(p => (
          <div key={p.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{p.episodeIds.length} episodes</div>
              </div>
              <div className="row">
                <button className="btn ghost" onClick={() => onDelete(p.id)}>Delete</button>
              </div>
            </div>
            {p.episodeIds.length > 0 && (
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => {
                  const queue = encodeURIComponent(p.episodeIds.join(','))
                  nav(`/player/${p.episodeIds[0]}?queue=${queue}`)
                }}>Play</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


