import { Router, Request, Response } from 'express';
import { db } from '../database';

const router = Router();

/**
 * GET /api/media
 * Get all media items with optional filtering and sorting
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { format, sort_by = 'created_at', sort_order = 'desc', search } = req.query;

    // Start with base query
    let query = db('media')
      .leftJoin('movie_series', 'media.id', 'movie_series.media_id')
      .leftJoin('series', 'movie_series.series_id', 'series.id')
      .select(
        'media.*',
        db.raw('GROUP_CONCAT(DISTINCT series.id) as series_ids'),
        db.raw('GROUP_CONCAT(DISTINCT series.name) as series_names'),
        db.raw('GROUP_CONCAT(DISTINCT series.sort_name) as series_sort_names')
      )
      .groupBy('media.id');

    // Search functionality
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(function() {
        this.where('media.title', 'like', searchTerm)
          .orWhere('media.director', 'like', searchTerm)
          .orWhere('media.synopsis', 'like', searchTerm)
          .orWhereRaw(`EXISTS (
            SELECT 1 FROM json_each(media.cast) 
            WHERE json_each.value LIKE ?
          )`, [searchTerm]);
      });
    }

    // Sorting
    const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';
    
    if (sort_by === 'series_sort') {
      // Sort by series sort name OR title (intermixed alphabetically)
      query = query.orderByRaw(`COALESCE(series.sort_name, media.title) ${sortDirection.toUpperCase()}`);
    } else if (sort_by === 'director_last_name') {
      // Extract last name from director field and sort by it
      query = query.orderByRaw(`
        CASE 
          WHEN media.director IS NOT NULL AND media.director != '' 
          THEN SUBSTR(media.director, INSTR(media.director, ' ') + 1)
          ELSE media.director
        END ${sortDirection.toUpperCase()} NULLS LAST
      `);
    } else {
      const validSortColumns = ['title', 'release_date', 'created_at'];
      const sortColumn = validSortColumns.includes(sort_by as string) ? `media.${sort_by}` : 'media.created_at';
      query = query.orderBy(sortColumn, sortDirection);
    }

    const media = await query;

    // Parse cast JSON strings and series data
    const mediaWithParsedData = media.map((item) => {
      const series_ids = item.series_ids ? item.series_ids.split(',').map(Number) : [];
      const series_names = item.series_names ? item.series_names.split(',') : [];
      const series_sort_names = item.series_sort_names ? item.series_sort_names.split(',') : [];
      
      const series = series_ids.map((id: number, index: number) => ({
        id,
        name: series_names[index],
        sort_name: series_sort_names[index],
      }));

      return {
        ...item,
        cast: item.cast ? JSON.parse(item.cast) : [],
        series,
        // Remove the concatenated fields
        series_ids: undefined,
        series_names: undefined,
        series_sort_names: undefined,
      };
    });

    res.json(mediaWithParsedData);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media items' });
  }
});

/**
 * GET /api/media/:id
 * Get a single media item by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const media = await db('media').where({ id }).first();

    if (!media) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    // Parse cast JSON string
    if (media.cast) {
      media.cast = JSON.parse(media.cast);
    }

    res.json(media);
  } catch (error) {
    console.error('Error fetching media item:', error);
    res.status(500).json({ error: 'Failed to fetch media item' });
  }
});

export default router;

