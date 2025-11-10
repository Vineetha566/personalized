const BASE_URL = 'http://localhost:4000/api'

function getToken() {
  try { return localStorage.getItem('token') } catch { return null }
}

async function http(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', 'Authorization': getToken() ? `Bearer ${getToken()}` : undefined, ...(options.headers || {}) },
    ...options
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const json = await res.json()
  return json
}

export async function getRecommendations(limit = 20, opts = {}) {
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  if (opts.source) qs.set('source', opts.source);
  if (opts.interests && opts.interests.length) qs.set('interests', opts.interests.join(','));
  const { recommendations } = await http(`/recommendations?${qs.toString()}`)
  return recommendations
}

export async function getSearchResults(q, source = 'spotify') {
  const qs = new URLSearchParams({ q: q || '' });
  if (source) qs.set('source', source);
  const { results } = await http(`/search?${qs.toString()}`)
  return results
}

export async function getPlaylists() {
  const { playlists } = await http('/playlists')
  return playlists
}

export async function createPlaylist(name) {
  const { playlist } = await http('/playlists', { method: 'POST', body: JSON.stringify({ name }) })
  return playlist
}

export async function deletePlaylistApi(playlistId) {
  const { playlists } = await http(`/playlists/${playlistId}`, { method: 'DELETE' })
  return playlists
}

export async function addEpisodeToPlaylist(playlistId, episodeId) {
  const { playlist } = await http(`/playlists/${playlistId}/episodes`, { method: 'POST', body: JSON.stringify({ episodeId }) })
  return playlist
}

export async function rateEpisode(episodeId, score) {
  await http(`/ratings/${episodeId}`, { method: 'POST', body: JSON.stringify({ score }) })
}

export async function getDigest() {
  const { digest } = await http('/notifications/digest')
  return digest
}

// History
export async function recordPlay(episodeId) {
  await http(`/recommendations/history/${episodeId}`, { method: 'POST' })
}
export async function getHistory() {
  const { history } = await http('/recommendations/history')
  return history
}

export async function getRecommendedPlaylists(max = 3, size = 8) {
  const { playlists } = await http(`/recommendations/playlists?max=${max}&size=${size}`)
  return playlists
}

export async function augmentFromSpotify() {
  return await http('/recommendations/augment-from-spotify', { method: 'POST' })
}

export async function buildAiEmbeddings() {
  await http('/ai/build-episode-embeddings', { method: 'POST' })
  await http('/ai/build-user-embedding', { method: 'POST' })
}

// Auth
export async function login(email, password) {
  return await http('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}
export async function register(name, email, password) {
  return await http('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) })
}

// Playback
export async function getPlaybackPosition(episodeId) {
  const { position } = await http(`/playback/${episodeId}`)
  return position
}
export async function savePlaybackPosition(episodeId, position) {
  await http(`/playback/${episodeId}`, { method: 'POST', body: JSON.stringify({ position }) })
}

// Downloads
export async function listDownloads() {
  const { episodes } = await http('/downloads')
  return episodes
}
export async function markDownloaded(episodeId) {
  await http(`/downloads/${episodeId}`, { method: 'POST' })
}
export async function unmarkDownloaded(episodeId) {
  await http(`/downloads/${episodeId}`, { method: 'DELETE' })
}

// Reviews
export async function listReviews(episodeId) {
  const { reviews } = await http(`/reviews/${episodeId}`)
  return reviews
}
export async function addReview(episodeId, text) {
  const { review } = await http(`/reviews/${episodeId}`, { method: 'POST', body: JSON.stringify({ text }) })
  return review
}

// Import YouTube playlist as podcast
export async function importYouTubePlaylist(playlistId) {
  const payload = /http(s)?:\/\//i.test(playlistId) ? { playlistUrl: playlistId } : { playlistId }
  return await http('/import/youtube', { method: 'POST', body: JSON.stringify(payload) })
}

export async function listChannelPlaylists(channelIdOrUrl) {
  const isUrl = /http(s)?:\/\//i.test(channelIdOrUrl)
  const param = isUrl ? `channelUrl=${encodeURIComponent(channelIdOrUrl)}` : `channelId=${encodeURIComponent(channelIdOrUrl)}`
  const { playlists } = await http(`/youtube/channel-playlists?${param}`)
  return playlists
}

// Episodes details
export async function getEpisodeByIdApi(episodeId) {
  const { episode } = await http(`/podcasts/episode/${episodeId}`)
  return episode
}
export async function getEpisodesByIdsApi(ids) {
  const { episodes } = await http(`/podcasts/episodes?ids=${ids.join(',')}`)
  return episodes
}


