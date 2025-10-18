import { Router, Request, Response } from 'express';
import { db } from '../database';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

interface Series {
  id?: number;
  name: string;
  sort_name: string;
  tmdb_collection_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface MovieSeries {
  id?: number;
  media_id: number;
  series_id: number;
  sort_order?: number;
  auto_sort: boolean;
}

/**
 * GET /api/series
 * Get all series
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const series = await db('series')
      .select('*')
      .orderBy('sort_name', 'asc');

    res.json(series);
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

/**
 * GET /api/series/:id
 * Get a single series by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const series = await db('series').where({ id }).first();

    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    res.json(series);
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

/**
 * GET /api/series/:id/movies
 * Get all movies in a series
 */
router.get('/:id/movies', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const movies = await db('media')
      .join('movie_series', 'media.id', 'movie_series.media_id')
      .where('movie_series.series_id', id)
      .select(
        'media.*',
        'movie_series.sort_order',
        'movie_series.auto_sort'
      )
      .orderBy([
        { column: 'movie_series.auto_sort', order: 'desc' },
        { column: 'media.release_date', order: 'asc' },
        { column: 'movie_series.sort_order', order: 'asc' }
      ]);

    // Parse cast JSON strings
    const moviesWithParsedCast = movies.map((item) => ({
      ...item,
      cast: item.cast ? JSON.parse(item.cast) : [],
    }));

    res.json(moviesWithParsedCast);
  } catch (error) {
    console.error('Error fetching series movies:', error);
    res.status(500).json({ error: 'Failed to fetch series movies' });
  }
});

/**
 * POST /api/series
 * Create a new series (protected)
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const seriesData: Series = req.body;

    // Validate required fields
    if (!seriesData.name || !seriesData.sort_name) {
      return res.status(400).json({ error: 'Name and sort_name are required' });
    }

    const [id] = await db('series').insert(seriesData);
    const newSeries = await db('series').where({ id }).first();

    res.status(201).json(newSeries);
  } catch (error) {
    console.error('Error creating series:', error);
    res.status(500).json({ error: 'Failed to create series' });
  }
});

/**
 * PUT /api/series/:id
 * Update a series (protected)
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const seriesData: Partial<Series> = req.body;

    // Check if series exists
    const existingSeries = await db('series').where({ id }).first();
    if (!existingSeries) {
      return res.status(404).json({ error: 'Series not found' });
    }

    // Remove id and timestamps from update data
    delete seriesData.id;
    delete (seriesData as any).created_at;
    delete (seriesData as any).updated_at;

    await db('series').where({ id }).update({
      ...seriesData,
      updated_at: db.fn.now(),
    });

    const updatedSeries = await db('series').where({ id }).first();

    res.json(updatedSeries);
  } catch (error) {
    console.error('Error updating series:', error);
    res.status(500).json({ error: 'Failed to update series' });
  }
});

/**
 * DELETE /api/series/:id
 * Delete a series (protected)
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if series exists
    const existingSeries = await db('series').where({ id }).first();
    if (!existingSeries) {
      return res.status(404).json({ error: 'Series not found' });
    }

    // Delete will cascade to movie_series due to foreign key
    await db('series').where({ id }).delete();

    res.json({ success: true, message: 'Series deleted successfully' });
  } catch (error) {
    console.error('Error deleting series:', error);
    res.status(500).json({ error: 'Failed to delete series' });
  }
});

export default router;


