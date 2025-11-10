import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Search from './pages/Search'
import Playlists from './pages/Playlists'
import Player from './pages/Player'
import Login from './pages/Login'
import Register from './pages/Register'
import { getRecommendedPlaylists, getHistory, augmentFromSpotify } from './api/client'
import EpisodeCard from './components/EpisodeCard'

function useAuthToken() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  return token
}

function Protected({ children }) {
  const token = useAuthToken()
  if (!token) return <Navigate to="/login" replace />
  return children
}

function logout() {
  try { localStorage.removeItem('token') } catch {}
  window.location.href = '/login'
}

function Recommended() {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const data = await getRecommendedPlaylists()
      setLists(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  return (
    <div>
      <h3>Recommended Playlists</h3>
      <div className="row" style={{ marginTop: 8, marginBottom: 8 }}>
        <button className="btn" onClick={async () => { try { const r = await augmentFromSpotify(); alert(`Imported ${r.imported} items from Spotify using tags: ${r.tags?.join(', ')||'defaults'}`) } catch (e) { alert('Spotify import failed: ' + (e.message || 'Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET')) } await refresh() }}>Boost with Spotify</button>
      </div>
      {loading && <div className="muted">Loading…</div>}
      {!loading && (
        <div className="grid" style={{ marginTop: 8 }}>
          {lists.map((pl) => (
            <div key={pl.id} className="panel aside">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{pl.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{pl.description}</div>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>{pl.episodes.length} episodes</div>
              </div>
              <div className="grid-cards" style={{ marginTop: 8 }}>
                {pl.episodes.map(e => (
                  <EpisodeCard key={`${pl.id}-${e.id}`} episode={e} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function History() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { (async () => {
    setLoading(true)
    try {
      const h = await getHistory()
      setItems(h)
    } finally { setLoading(false) }
  })() }, [])

  return (
    <div>
      <h3>History</h3>
      {loading && <div className="muted">Loading…</div>}
      {!loading && items.length === 0 && <div className="muted" style={{ marginTop: 8 }}>No listening history yet. Play something!</div>}
      <div className="grid" style={{ marginTop: 8 }}>
        {items.map(it => (
          <div key={`${it.id}-${it.playedAt}`} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{it.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>{it.podcastTitle}</div>
            </div>
            <Link className="btn" to={`/player/${it.id}`}>Play</Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <header className="header">
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/search">Search</Link>
            <Link to="/playlists">Playlists</Link>
            <Link to="/recommended">Recommended</Link>
            <Link to="/history">History</Link>
          </nav>
          <div className="nav">
            {useAuthToken() ? (
              <button className="btn ghost" onClick={logout}>Logout</button>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Protected><Home /></Protected>} />
          <Route path="/search" element={<Protected><Search /></Protected>} />
          <Route path="/playlists" element={<Protected><Playlists /></Protected>} />
          <Route path="/recommended" element={<Protected><Recommended /></Protected>} />
          <Route path="/history" element={<Protected><History /></Protected>} />
          <Route path="/player/:episodeId" element={<Protected><Player /></Protected>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}


