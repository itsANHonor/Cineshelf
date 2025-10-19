import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { setupDatabase } from './database';

// Import routes
import authRoutes from './routes/auth.routes';
import mediaRoutes from './routes/media.routes';
import settingsRoutes from './routes/settings.routes';
import searchRoutes from './routes/search.routes';
import seriesRoutes from './routes/series.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
setupDatabase();

// Serve uploaded files statically (must be before API routes for proper handling)
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Hello World from Cineshelf API!' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/series', seriesRoutes);

// Serve static frontend files (React build)
// This must come AFTER API routes so API routes take precedence
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// SPA fallback - serve index.html for all other routes
// This handles client-side routing for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Cineshelf server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
});
