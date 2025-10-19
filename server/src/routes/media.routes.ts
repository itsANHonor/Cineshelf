import { Router, Request, Response } from 'express';
import { db } from '../database';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

interface MediaItem {
  id?: number;
  title: string;
  tmdb_id?: number;
  synopsis?: string;
  cover_art_url?: string;
  release_date?: string;
  director?: string;
  cast?: string; // JSON string
  physical_format: string; // JSON string of array
  edition_notes?: string;
  region_code?: string;
  custom_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * GET /api/media
 * Get all media items with optional filtering and sorting
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { format, sort_by = 'created_at', sort_order = 'desc' } = req.query;

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

    // Filter by physical format - check if format is in the JSON array
    if (format && format !== 'all') {
      query = query.whereRaw(`EXISTS (
        SELECT 1 FROM json_each(media.physical_format) 
        WHERE json_each.value = ?
      )`, [format]);
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
      const validSortColumns = ['title', 'release_date', 'created_at', 'physical_format'];
      const sortColumn = validSortColumns.includes(sort_by as string) ? `media.${sort_by}` : 'media.created_at';
      query = query.orderBy(sortColumn, sortDirection);
    }

    const media = await query;

    // Parse cast, physical_format JSON strings and series data
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
        physical_format: item.physical_format ? JSON.parse(item.physical_format) : [],
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

    // Parse cast and physical_format JSON strings
    if (media.cast) {
      media.cast = JSON.parse(media.cast);
    }
    if (media.physical_format) {
      media.physical_format = JSON.parse(media.physical_format);
    }

    res.json(media);
  } catch (error) {
    console.error('Error fetching media item:', error);
    res.status(500).json({ error: 'Failed to fetch media item' });
  }
});

/**
 * POST /api/media
 * Create a new media item (protected)
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { series_associations, ...mediaData }: any = req.body;

    // Validate required fields
    if (!mediaData.title || !mediaData.physical_format) {
      return res.status(400).json({ error: 'Title and physical_format are required' });
    }

    // Validate and convert physical_format to JSON array
    let formatArray: string[];
    if (Array.isArray(mediaData.physical_format)) {
      formatArray = mediaData.physical_format;
    } else if (typeof mediaData.physical_format === 'string') {
      // If single string, convert to array
      formatArray = [mediaData.physical_format];
    } else {
      return res.status(400).json({ error: 'physical_format must be a string or array' });
    }

    // Validate each format
    const validFormats = ['4K UHD', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'];
    for (const format of formatArray) {
      if (!validFormats.includes(format)) {
        return res.status(400).json({ 
          error: `Invalid physical format: ${format}. Must be one of: ${validFormats.join(', ')}` 
        });
      }
    }

    if (formatArray.length === 0) {
      return res.status(400).json({ error: 'At least one physical format is required' });
    }

    mediaData.physical_format = JSON.stringify(formatArray);

    // Convert cast array to JSON string if provided
    if (mediaData.cast && typeof mediaData.cast !== 'string') {
      mediaData.cast = JSON.stringify(mediaData.cast);
    }

    const [id] = await db('media').insert(mediaData);

    // Handle series associations
    if (series_associations && Array.isArray(series_associations) && series_associations.length > 0) {
      const associations = series_associations.map((assoc) => ({
        media_id: id,
        series_id: assoc.series_id,
        sort_order: assoc.sort_order || null,
        auto_sort: assoc.auto_sort !== undefined ? assoc.auto_sort : true,
      }));
      await db('movie_series').insert(associations);
    }

    const newMedia = await db('media').where({ id }).first();

    // Parse cast and physical_format back to arrays for response
    if (newMedia.cast) {
      newMedia.cast = JSON.parse(newMedia.cast);
    }
    if (newMedia.physical_format) {
      newMedia.physical_format = JSON.parse(newMedia.physical_format);
    }

    // Fetch series data
    const seriesData = await db('movie_series')
      .join('series', 'movie_series.series_id', 'series.id')
      .where('movie_series.media_id', id)
      .select('series.*', 'movie_series.sort_order', 'movie_series.auto_sort');

    newMedia.series = seriesData;

    res.status(201).json(newMedia);
  } catch (error) {
    console.error('Error creating media item:', error);
    res.status(500).json({ error: 'Failed to create media item' });
  }
});

/**
 * PUT /api/media/:id
 * Update a media item (protected)
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { series_associations, ...mediaData }: any = req.body;

    // Check if media exists
    const existingMedia = await db('media').where({ id }).first();
    if (!existingMedia) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    // Validate and convert physical_format to JSON array if provided
    if (mediaData.physical_format !== undefined) {
      let formatArray: string[];
      if (Array.isArray(mediaData.physical_format)) {
        formatArray = mediaData.physical_format;
      } else if (typeof mediaData.physical_format === 'string') {
        formatArray = [mediaData.physical_format];
      } else {
        return res.status(400).json({ error: 'physical_format must be a string or array' });
      }

      // Validate each format
      const validFormats = ['4K UHD', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'];
      for (const format of formatArray) {
        if (!validFormats.includes(format)) {
          return res.status(400).json({ 
            error: `Invalid physical format: ${format}. Must be one of: ${validFormats.join(', ')}` 
          });
        }
      }

      if (formatArray.length === 0) {
        return res.status(400).json({ error: 'At least one physical format is required' });
      }

      mediaData.physical_format = JSON.stringify(formatArray);
    }

    // Convert cast array to JSON string if provided
    if (mediaData.cast && typeof mediaData.cast !== 'string') {
      mediaData.cast = JSON.stringify(mediaData.cast);
    }

    // Remove id and timestamps from update data
    delete mediaData.id;
    delete (mediaData as any).created_at;
    delete (mediaData as any).updated_at;

    await db('media').where({ id }).update({
      ...mediaData,
      updated_at: db.fn.now(),
    });

    // Handle series associations update
    if (series_associations !== undefined) {
      // Delete existing associations
      await db('movie_series').where({ media_id: id }).delete();
      
      // Insert new associations
      if (Array.isArray(series_associations) && series_associations.length > 0) {
        const associations = series_associations.map((assoc) => ({
          media_id: parseInt(id),
          series_id: assoc.series_id,
          sort_order: assoc.sort_order || null,
          auto_sort: assoc.auto_sort !== undefined ? assoc.auto_sort : true,
        }));
        await db('movie_series').insert(associations);
      }
    }

    const updatedMedia = await db('media').where({ id }).first();

    // Parse cast and physical_format back to arrays for response
    if (updatedMedia.cast) {
      updatedMedia.cast = JSON.parse(updatedMedia.cast);
    }
    if (updatedMedia.physical_format) {
      updatedMedia.physical_format = JSON.parse(updatedMedia.physical_format);
    }

    // Fetch series data
    const seriesData = await db('movie_series')
      .join('series', 'movie_series.series_id', 'series.id')
      .where('movie_series.media_id', id)
      .select('series.*', 'movie_series.sort_order', 'movie_series.auto_sort');

    updatedMedia.series = seriesData;

    res.json(updatedMedia);
  } catch (error) {
    console.error('Error updating media item:', error);
    res.status(500).json({ error: 'Failed to update media item' });
  }
});

/**
 * DELETE /api/media/:id
 * Delete a media item (protected)
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if media exists
    const existingMedia = await db('media').where({ id }).first();
    if (!existingMedia) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    await db('media').where({ id }).delete();

    res.json({ success: true, message: 'Media item deleted successfully' });
  } catch (error) {
    console.error('Error deleting media item:', error);
    res.status(500).json({ error: 'Failed to delete media item' });
  }
});

/**
 * POST /api/media/upload
 * Upload custom image for media item (protected)
 */
router.post('/upload', authMiddleware, upload.single('image'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

export default router;

