import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { setupDatabase } from './database';

// Import read-only routes
import authReadOnlyRoutes from './routes/auth-readonly.routes';
import mediaReadOnlyRoutes from './routes/media-readonly.routes';
import physicalItemsReadOnlyRoutes from './routes/physical-items-readonly.routes';
import settingsReadOnlyRoutes from './routes/settings-readonly.routes';
import searchRoutes from './routes/search.routes';
import seriesReadOnlyRoutes from './routes/series-readonly.routes';
import importExportReadOnlyRoutes from './routes/import-export-readonly.routes';
import statisticsRoutes from './routes/statistics.routes';

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
  res.json({ message: 'Hello World from Cineshelf API! (Read-Only Mode)' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    mode: 'readonly',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authReadOnlyRoutes);
app.use('/api/media', mediaReadOnlyRoutes);
app.use('/api/physical-items', physicalItemsReadOnlyRoutes);
app.use('/api/settings', settingsReadOnlyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/series', seriesReadOnlyRoutes);
app.use('/api/import-export', importExportReadOnlyRoutes);
app.use('/api/statistics', statisticsRoutes);

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
  console.log(`🎬 Cineshelf server running on port ${PORT} (Read-Only Mode)`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
});

