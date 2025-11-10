import React, { useState } from 'react'

export default function PlaylistPanel({ playlists, onCreate, onDelete }) {
  const [name, setName] = useState('')
  return (
    <div className="sticky panel aside">
      <h3>Playlists</h3>
      <div className="row" style={{ marginBottom: 8 }}>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="New playlist name" style={{ flex: 1 }} />
        <button className="btn" onClick={() => { if (name.trim()) { onCreate && onCreate(name.trim()); setName('') } }}>Create</button>
      </div>
      <div className="grid">
        {playlists.map(p => (
          <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{p.episodeIds.length} episodes</div>
            </div>
            <button className="btn ghost" onClick={() => onDelete && onDelete(p.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}


