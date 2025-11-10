import React, { useState } from 'react'
import { getSearchResults, rateEpisode } from '../api/client'
import EpisodeCard from '../components/EpisodeCard'
import SearchBar from '../components/SearchBar'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [spotifyOnly, setSpotifyOnly] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSearch() {
    setLoading(true)
    try {
      const res = await getSearchResults(query, spotifyOnly ? 'spotify' : undefined)
      setResults(res)
    } finally {
      setLoading(false)
    }
  }
  async function onRate(episodeId, score) {
    await rateEpisode(episodeId, score)
  }

  return (
    <div>
      <SearchBar value={query} onChange={setQuery} onSearch={onSearch} />
      <div className="row" style={{ marginTop: 8, alignItems: 'center' }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
          <input type="checkbox" checked={spotifyOnly} onChange={e=>setSpotifyOnly(e.target.checked)} /> Spotify only
        </label>
        <div className="muted" style={{ fontSize: 12 }}>Use "Boost with Spotify" on Home to import more Spotify shows.</div>
      </div>
      {loading && <div className="muted" style={{ marginTop: 12 }}>Searching…</div>}
      {!loading && results.length === 0 && query && (
        <div className="muted" style={{ marginTop: 12 }}>No results. Try removing Spotify-only or importing content from Home.</div>
      )}
      <div className="grid-cards" style={{ marginTop: 16 }}>
        {results.map((r) => (
          <EpisodeCard key={(r.item.id || '') + r.type} episode={r.type === 'episode' ? r.item : null} podcast={r.type === 'podcast' ? r.item : null} onRate={onRate} />
        ))}
      </div>
    </div>
  )
}


