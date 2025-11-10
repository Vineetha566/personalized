const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan('dev'));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Routes
const podcastsRouter = require('./routes/podcasts');
const searchRouter = require('./routes/search');
const playlistsRouter = require('./routes/playlists');
const ratingsRouter = require('./routes/ratings');
const notificationsRouter = require('./routes/notifications');
const recommendationsRouter = require('./routes/recommendations');
const authRouter = require('./routes/auth');
const playbackRouter = require('./routes/playback');
const downloadsRouter = require('./routes/downloads');
const reviewsRouter = require('./routes/reviews');
const importRouter = require('./routes/import');
const youtubeRouter = require('./routes/youtube');
const aiRouter = require('./routes/ai');

app.use('/api/podcasts', podcastsRouter);
app.use('/api/search', searchRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/playback', playbackRouter);
app.use('/api/downloads', downloadsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/import', importRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/ai', aiRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});


