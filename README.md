# Personalized Podcast Application

An end-to-end demo app that recommends podcasts based on user interests, listening habits, and preferences. Includes AI-style recommendations, playlists, search, ratings, and notifications.

## Stack
- Backend: Node.js + Express
- Frontend: React + Vite
- Data: Mock in-memory DB with sample podcast catalog

## Features
- Dynamic episode recommendations based on tags, ratings, and listening history
- Playlist creation and management
- Search by title, description, and tags
- Episode ratings and simple feedback loop
- Mock notifications (digest + new episode alerts)

## Getting Started

### Prerequisites
- Node.js 18+

### Backend
```bash
cd backend
npm install
npm run dev
```
By default, the backend runs on http://localhost:4000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend runs on http://localhost:5173

### Environment Variables
Copy `.env.example` to `.env` in `backend/` to override defaults.

## Project Structure
```
personalized-podcast-app/
  backend/
    src/
      server.js
      routes/
        podcasts.js
        playlists.js
        search.js
        ratings.js
        notifications.js
        recommendations.js
      data/
        podcasts.json
      recommendation/
        engine.js
      db/
        mockDb.js
    package.json
    .env.example
  frontend/
    index.html
    src/
      main.jsx
      App.jsx
      api/client.js
      components/
        EpisodeCard.jsx
        PlaylistPanel.jsx
        RatingStars.jsx
        SearchBar.jsx
        NotificationBell.jsx
      pages/
        Home.jsx
        Search.jsx
        Playlists.jsx
        Player.jsx
    package.json
    vite.config.js
  README.md
```

## Notes on Recommendation Engine
- Content-based similarity over tags and description terms
- Lightweight user profile aggregated from history and explicit interests
- Reranks with recent popularity and user ratings

## Scripts
- Backend
  - `npm run dev`: start with nodemon
  - `npm start`: start server
- Frontend
  - `npm run dev`: Vite dev server
  - `npm run build`: production build
  - `npm run preview`: preview build

## License
MIT


