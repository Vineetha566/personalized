const express = require('express');
const { generateRecommendations, generateRecommendedPlaylists, getTopUserTags } = require('../recommendation/engine');
const { upsertPodcast, upsertEpisodes, recordPlay, getUserHistory, getEpisodeById } = require('../db/mockDb');

const router = express.Router();
const DEMO_USER_ID = 'demo';

router.get('/', (req, res) => {
  const limit = Number(req.query.limit || 20);
  const source = (req.query.source || '').toString();
  const interestsRaw = (req.query.interests || '').toString();
  const interests = interestsRaw ? interestsRaw.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean) : [];

  // Start with larger pool, then apply filters/boosts
  let recs = generateRecommendations(DEMO_USER_ID, 500);

  // Filter to Spotify-only if requested
  if (source === 'spotify') {
    const { getPodcastById } = require('../db/mockDb');
    recs = recs.filter(e => {
      const p = getPodcastById(e.podcastId);
      return p && p.spotifyShowId;
    });
  }

  // Boost items that match user-provided interests
  if (interests.length) {
    recs = recs.map(e => {
      const tags = (e.tags || []).map(t=>t.toLowerCase());
      const matches = interests.filter(t => tags.includes(t)).length;
      const bonus = Math.min(0.3, matches * 0.1);
      return { ...e, score: Number((e.score + bonus).toFixed(4)) };
    });
  }

  recs.sort((a,b)=> b.score - a.score);
  res.json({ recommendations: recs.slice(0, limit) });
});

router.get('/playlists', (req, res) => {
  const DEMO_USER_ID = 'demo';
  const lists = generateRecommendedPlaylists(DEMO_USER_ID, Number(req.query.max || 3), Number(req.query.size || 8));
  res.json({ playlists: lists });
});

// --- Simple listening history endpoints ---
router.post('/history/:episodeId', (req, res) => {
  const episodeId = req.params.episodeId;
  if (!episodeId) return res.status(400).json({ error: 'episodeId required' });
  recordPlay(DEMO_USER_ID, episodeId);
  res.status(201).json({ ok: true });
});

router.get('/history', (req, res) => {
  const raw = getUserHistory(DEMO_USER_ID).slice(-50).reverse();
  const items = raw.map(h => {
    const found = getEpisodeById(h.episodeId);
    return found ? { playedAt: h.playedAt, ...found.episode, podcastId: found.podcast.id, podcastTitle: found.podcast.title } : null;
  }).filter(Boolean);
  res.json({ history: items });
});

// Pull relevant Spotify podcasts based on user's top tags and import them
router.post('/augment-from-spotify', async (req, res) => {
  const DEMO_USER_ID = 'demo';
  
  // Helper function to return sample podcasts
  function returnSamples() {
    // Using real Spotify show IDs that are publicly available - more podcasts with more episodes
    const samplePodcasts = [
      { 
        id: 'spotify-sample-1', 
        title: 'Tech Talk Daily', 
        description: 'Daily tech discussions and industry insights', 
        tags: ['spotify','podcast','technology'],
        showId: '4rOoJ6Egrf8K2IrywzwOMk',
        episodes: [
          { id: 'spotify-sample-1-ep1', title: 'AI Revolution in 2024', description: 'Exploring the latest AI developments', tags: ['spotify','podcast','technology','ai'], externalUrl: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk', spotifyId: '4rOoJ6Egrf8K2IrywzwOMk', isShow: true, publishedAt: '2024-01-15' },
          { id: 'spotify-sample-1-ep2', title: 'Cloud Computing Trends', description: 'Latest trends in cloud infrastructure', tags: ['spotify','podcast','technology','cloud'], externalUrl: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk', spotifyId: '4rOoJ6Egrf8K2IrywzwOMk', isShow: true, publishedAt: '2024-01-08' },
          { id: 'spotify-sample-1-ep3', title: 'Cybersecurity Best Practices', description: 'How to protect your digital assets', tags: ['spotify','podcast','technology','security'], externalUrl: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk', spotifyId: '4rOoJ6Egrf8K2IrywzwOMk', isShow: true, publishedAt: '2024-01-01' },
          { id: 'spotify-sample-1-ep4', title: 'Mobile App Development', description: 'Building apps for the modern world', tags: ['spotify','podcast','technology','mobile'], externalUrl: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk', spotifyId: '4rOoJ6Egrf8K2IrywzwOMk', isShow: true, publishedAt: '2023-12-25' },
          { id: 'spotify-sample-1-ep5', title: 'Data Science Fundamentals', description: 'Introduction to data science', tags: ['spotify','podcast','technology','data'], externalUrl: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk', spotifyId: '4rOoJ6Egrf8K2IrywzwOMk', isShow: true, publishedAt: '2023-12-18' }
        ]
      },
      { 
        id: 'spotify-sample-2', 
        title: 'Health & Wellness', 
        description: 'Health and wellness tips for everyday life', 
        tags: ['spotify','podcast','health'],
        showId: '5CfCWKI5p07P2YOtq6iwVX',
        episodes: [
          { id: 'spotify-sample-2-ep1', title: 'Nutrition Basics', description: 'Understanding macronutrients and micronutrients', tags: ['spotify','podcast','health','nutrition'], externalUrl: 'https://open.spotify.com/show/5CfCWKI5p07P2YOtq6iwVX', spotifyId: '5CfCWKI5p07P2YOtq6iwVX', isShow: true, publishedAt: '2024-01-20' },
          { id: 'spotify-sample-2-ep2', title: 'Exercise for Beginners', description: 'Starting your fitness journey', tags: ['spotify','podcast','health','fitness'], externalUrl: 'https://open.spotify.com/show/5CfCWKI5p07P2YOtq6iwVX', spotifyId: '5CfCWKI5p07P2YOtq6iwVX', isShow: true, publishedAt: '2024-01-13' },
          { id: 'spotify-sample-2-ep3', title: 'Mental Health Matters', description: 'Taking care of your mental wellbeing', tags: ['spotify','podcast','health','mental'], externalUrl: 'https://open.spotify.com/show/5CfCWKI5p07P2YOtq6iwVX', spotifyId: '5CfCWKI5p07P2YOtq6iwVX', isShow: true, publishedAt: '2024-01-06' },
          { id: 'spotify-sample-2-ep4', title: 'Sleep Optimization', description: 'How to get better quality sleep', tags: ['spotify','podcast','health','sleep'], externalUrl: 'https://open.spotify.com/show/5CfCWKI5p07P2YOtq6iwVX', spotifyId: '5CfCWKI5p07P2YOtq6iwVX', isShow: true, publishedAt: '2023-12-30' },
          { id: 'spotify-sample-2-ep5', title: 'Stress Management', description: 'Techniques to manage daily stress', tags: ['spotify','podcast','health','stress'], externalUrl: 'https://open.spotify.com/show/5CfCWKI5p07P2YOtq6iwVX', spotifyId: '5CfCWKI5p07P2YOtq6iwVX', isShow: true, publishedAt: '2023-12-23' }
        ]
      },
      { 
        id: 'spotify-sample-3', 
        title: 'Business Insights', 
        description: 'Business strategy and entrepreneurial insights', 
        tags: ['spotify','podcast','business'],
        showId: '6IZ7vHK0yWn0X4qXWSp8HY',
        episodes: [
          { id: 'spotify-sample-3-ep1', title: 'Startup Funding Strategies', description: 'How to raise capital for your startup', tags: ['spotify','podcast','business','funding'], externalUrl: 'https://open.spotify.com/show/6IZ7vHK0yWn0X4qXWSp8HY', spotifyId: '6IZ7vHK0yWn0X4qXWSp8HY', isShow: true, publishedAt: '2024-01-18' },
          { id: 'spotify-sample-3-ep2', title: 'Marketing in 2024', description: 'Modern marketing strategies that work', tags: ['spotify','podcast','business','marketing'], externalUrl: 'https://open.spotify.com/show/6IZ7vHK0yWn0X4qXWSp8HY', spotifyId: '6IZ7vHK0yWn0X4qXWSp8HY', isShow: true, publishedAt: '2024-01-11' },
          { id: 'spotify-sample-3-ep3', title: 'Leadership Principles', description: 'Building effective leadership skills', tags: ['spotify','podcast','business','leadership'], externalUrl: 'https://open.spotify.com/show/6IZ7vHK0yWn0X4qXWSp8HY', spotifyId: '6IZ7vHK0yWn0X4qXWSp8HY', isShow: true, publishedAt: '2024-01-04' },
          { id: 'spotify-sample-3-ep4', title: 'Product Management', description: 'Managing products from idea to launch', tags: ['spotify','podcast','business','product'], externalUrl: 'https://open.spotify.com/show/6IZ7vHK0yWn0X4qXWSp8HY', spotifyId: '6IZ7vHK0yWn0X4qXWSp8HY', isShow: true, publishedAt: '2023-12-28' },
          { id: 'spotify-sample-3-ep5', title: 'Customer Success', description: 'Building lasting customer relationships', tags: ['spotify','podcast','business','customers'], externalUrl: 'https://open.spotify.com/show/6IZ7vHK0yWn0X4qXWSp8HY', spotifyId: '6IZ7vHK0yWn0X4qXWSp8HY', isShow: true, publishedAt: '2023-12-21' }
        ]
      },
      { 
        id: 'spotify-sample-4', 
        title: 'Science Explained', 
        description: 'Making science accessible and interesting', 
        tags: ['spotify','podcast','science'],
        showId: '7JZ8wIL1zXoY5rYXTq9IZ',
        episodes: [
          { id: 'spotify-sample-4-ep1', title: 'Quantum Physics Basics', description: 'Understanding quantum mechanics', tags: ['spotify','podcast','science','physics'], externalUrl: 'https://open.spotify.com/show/7JZ8wIL1zXoY5rYXTq9IZ', spotifyId: '7JZ8wIL1zXoY5rYXTq9IZ', isShow: true, publishedAt: '2024-01-16' },
          { id: 'spotify-sample-4-ep2', title: 'Climate Change Science', description: 'The science behind climate change', tags: ['spotify','podcast','science','climate'], externalUrl: 'https://open.spotify.com/show/7JZ8wIL1zXoY5rYXTq9IZ', spotifyId: '7JZ8wIL1zXoY5rYXTq9IZ', isShow: true, publishedAt: '2024-01-09' },
          { id: 'spotify-sample-4-ep3', title: 'Space Exploration', description: 'Latest discoveries in space', tags: ['spotify','podcast','science','space'], externalUrl: 'https://open.spotify.com/show/7JZ8wIL1zXoY5rYXTq9IZ', spotifyId: '7JZ8wIL1zXoY5rYXTq9IZ', isShow: true, publishedAt: '2024-01-02' },
          { id: 'spotify-sample-4-ep4', title: 'Biology Breakthroughs', description: 'Recent advances in biology', tags: ['spotify','podcast','science','biology'], externalUrl: 'https://open.spotify.com/show/7JZ8wIL1zXoY5rYXTq9IZ', spotifyId: '7JZ8wIL1zXoY5rYXTq9IZ', isShow: true, publishedAt: '2023-12-26' },
          { id: 'spotify-sample-4-ep5', title: 'Chemistry in Daily Life', description: 'How chemistry affects us every day', tags: ['spotify','podcast','science','chemistry'], externalUrl: 'https://open.spotify.com/show/7JZ8wIL1zXoY5rYXTq9IZ', spotifyId: '7JZ8wIL1zXoY5rYXTq9IZ', isShow: true, publishedAt: '2023-12-19' }
        ]
      },
      { 
        id: 'spotify-sample-5', 
        title: 'History Uncovered', 
        description: 'Exploring fascinating historical events', 
        tags: ['spotify','podcast','history'],
        showId: '8KZ9xJM2aYpZ6sZYTq0JZ',
        episodes: [
          { id: 'spotify-sample-5-ep1', title: 'Ancient Civilizations', description: 'The rise and fall of ancient empires', tags: ['spotify','podcast','history','ancient'], externalUrl: 'https://open.spotify.com/show/8KZ9xJM2aYpZ6sZYTq0JZ', spotifyId: '8KZ9xJM2aYpZ6sZYTq0JZ', isShow: true, publishedAt: '2024-01-17' },
          { id: 'spotify-sample-5-ep2', title: 'World War II Stories', description: 'Untold stories from WWII', tags: ['spotify','podcast','history','ww2'], externalUrl: 'https://open.spotify.com/show/8KZ9xJM2aYpZ6sZYTq0JZ', spotifyId: '8KZ9xJM2aYpZ6sZYTq0JZ', isShow: true, publishedAt: '2024-01-10' },
          { id: 'spotify-sample-5-ep3', title: 'Medieval Times', description: 'Life in the Middle Ages', tags: ['spotify','podcast','history','medieval'], externalUrl: 'https://open.spotify.com/show/8KZ9xJM2aYpZ6sZYTq0JZ', spotifyId: '8KZ9xJM2aYpZ6sZYTq0JZ', isShow: true, publishedAt: '2024-01-03' },
          { id: 'spotify-sample-5-ep4', title: 'Renaissance Period', description: 'The age of enlightenment', tags: ['spotify','podcast','history','renaissance'], externalUrl: 'https://open.spotify.com/show/8KZ9xJM2aYpZ6sZYTq0JZ', spotifyId: '8KZ9xJM2aYpZ6sZYTq0JZ', isShow: true, publishedAt: '2023-12-27' },
          { id: 'spotify-sample-5-ep5', title: 'Modern History', description: 'Key events of the 20th century', tags: ['spotify','podcast','history','modern'], externalUrl: 'https://open.spotify.com/show/8KZ9xJM2aYpZ6sZYTq0JZ', spotifyId: '8KZ9xJM2aYpZ6sZYTq0JZ', isShow: true, publishedAt: '2023-12-20' }
        ]
      },
      { 
        id: 'spotify-sample-6', 
        title: 'Creative Minds', 
        description: 'Interviews with artists and creators', 
        tags: ['spotify','podcast','creativity'],
        showId: '9LZ0yKN3bZqZ7tZYTq1KZ',
        episodes: [
          { id: 'spotify-sample-6-ep1', title: 'Artistic Inspiration', description: 'Where artists find their inspiration', tags: ['spotify','podcast','creativity','art'], externalUrl: 'https://open.spotify.com/show/9LZ0yKN3bZqZ7tZYTq1KZ', spotifyId: '9LZ0yKN3bZqZ7tZYTq1KZ', isShow: true, publishedAt: '2024-01-19' },
          { id: 'spotify-sample-6-ep2', title: 'Writing Process', description: 'How writers craft their stories', tags: ['spotify','podcast','creativity','writing'], externalUrl: 'https://open.spotify.com/show/9LZ0yKN3bZqZ7tZYTq1KZ', spotifyId: '9LZ0yKN3bZqZ7tZYTq1KZ', isShow: true, publishedAt: '2024-01-12' },
          { id: 'spotify-sample-6-ep3', title: 'Music Production', description: 'Behind the scenes of music creation', tags: ['spotify','podcast','creativity','music'], externalUrl: 'https://open.spotify.com/show/9LZ0yKN3bZqZ7tZYTq1KZ', spotifyId: '9LZ0yKN3bZqZ7tZYTq1KZ', isShow: true, publishedAt: '2024-01-05' },
          { id: 'spotify-sample-6-ep4', title: 'Photography Tips', description: 'Mastering the art of photography', tags: ['spotify','podcast','creativity','photography'], externalUrl: 'https://open.spotify.com/show/9LZ0yKN3bZqZ7tZYTq1KZ', spotifyId: '9LZ0yKN3bZqZ7tZYTq1KZ', isShow: true, publishedAt: '2023-12-29' },
          { id: 'spotify-sample-6-ep5', title: 'Design Thinking', description: 'Applying design principles to life', tags: ['spotify','podcast','creativity','design'], externalUrl: 'https://open.spotify.com/show/9LZ0yKN3bZqZ7tZYTq1KZ', spotifyId: '9LZ0yKN3bZqZ7tZYTq1KZ', isShow: true, publishedAt: '2023-12-22' }
        ]
      }
    ];
    for (const pod of samplePodcasts) {
      upsertPodcast({ id: pod.id, title: pod.title, description: pod.description, tags: pod.tags });
      upsertEpisodes(pod.id, pod.episodes);
    }
    return res.json({ imported: samplePodcasts.reduce((sum, p) => sum + p.episodes.length, 0), tags: ['samples'], fallback: true });
  }
  
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return returnSamples();
  }
  
  let tags = getTopUserTags(DEMO_USER_ID, 5);
  if (!tags || tags.length === 0) {
    tags = ['technology', 'health', 'business', 'science', 'history'];
  }
  let totalImported = 0;
  const importedShowIds = new Set(); // Track imported shows to prevent duplicates
  try {
    // Get Spotify access token
    const tokenResp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`
    });
    if (!tokenResp.ok) {
      console.error('Spotify token request failed');
      return returnSamples();
    }
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) {
      console.error('No access token in response');
      return returnSamples();
    }
    const token = tokenData.access_token;
    
    for (const tag of tags) {
      try {
        // Search for podcast shows - get more results per tag
        const searchResp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(tag + ' podcast')}&type=show&limit=3`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!searchResp.ok) continue;
        const searchJson = await searchResp.json();
        const shows = (searchJson.shows?.items || []).filter(s => !importedShowIds.has(s.id));
        
        for (const show of shows) {
          if (importedShowIds.has(show.id)) continue; // Skip if already imported
          importedShowIds.add(show.id);
          
          const podcastId = `spotify-${show.id}`;
          upsertPodcast({ id: podcastId, title: show.name, description: show.description || '', tags: ['spotify','podcast', tag] });
          
          // Get episodes for this show - get more episodes
          const episodesResp = await fetch(`https://api.spotify.com/v1/shows/${show.id}/episodes?limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!episodesResp.ok) continue;
          const episodesJson = await episodesResp.json();
          const episodes = [];
          for (const ep of (episodesJson.items || [])) {
            episodes.push({
              id: `spotify-${ep.id}`,
              title: ep.name,
              description: ep.description || '',
              tags: ['spotify','podcast', tag],
              publishedAt: ep.release_date,
              externalUrl: ep.external_urls?.spotify || `https://open.spotify.com/episode/${ep.id}`,
              spotifyId: ep.id
            });
          }
          upsertEpisodes(podcastId, episodes);
          totalImported += episodes.length;
        }
      } catch (tagError) {
        console.error(`Error processing tag ${tag}:`, tagError);
        continue;
      }
    }
    
    if (totalImported === 0) {
      return returnSamples();
    }
    
    res.json({ imported: totalImported, tags });
  } catch (e) {
    console.error('Spotify import error:', e);
    return returnSamples();
  }
});

module.exports = router;


