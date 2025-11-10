import React, { useEffect, useState } from 'react'
import { getRecommendations, listDownloads, markDownloaded, unmarkDownloaded } from '../api/client'

const CACHE_NAME = 'podcast-audio-cache-v1'

async function cacheAudio(url) {
  const cache = await caches.open(CACHE_NAME)
  const res = await fetch(url)
  await cache.put(url, res.clone())
}

async function removeCached(url) {
  const cache = await caches.open(CACHE_NAME)
  await cache.delete(url)
}

export default function Downloads() {
  const [episodes, setEpisodes] = useState([])
  const [downloadedIds, setDownloadedIds] = useState([])

  useEffect(() => {
    (async () => {
      const recs = await getRecommendations(100)
      setEpisodes(recs)
      const server = await listDownloads()
      setDownloadedIds(server)
    })()
  }, [])

  async function download(ep) {
    await cacheAudio(ep.audioUrl)
    await markDownloaded(ep.id)
    setDownloadedIds(prev => prev.concat([ep.id]))
  }

  async function remove(ep) {
    await removeCached(ep.audioUrl)
    await unmarkDownloaded(ep.id)
    setDownloadedIds(prev => prev.filter(id => id !== ep.id))
  }

  return (
    <div>
      <h3>Downloads & Offline</h3>
      <div className="grid-cards">
        {episodes.map(ep => (
          <div key={ep.id} className="card">
            <div style={{ fontWeight: 600 }}>{ep.title}</div>
            <div className="muted" style={{ fontSize: 12 }}>{ep.podcastTitle}</div>
            <div style={{ marginTop: 8 }}>
              {downloadedIds.includes(ep.id) ? (
                <button className="btn danger" onClick={() => remove(ep)}>Remove Offline</button>
              ) : (
                <button className="btn" onClick={() => download(ep)}>Download Offline</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


