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
  physical_format: string;
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

    let query = db('media').select('*');

    // Filter by physical format
    if (format && format !== 'all') {
      query = query.where('physical_format', format);
    }

    // Sorting
    const validSortColumns = ['title', 'release_date', 'created_at', 'physical_format'];
    const sortColumn = validSortColumns.includes(sort_by as string) ? sort_by as string : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortColumn, sortDirection);

    const media = await query;

    // Parse cast JSON strings
    const mediaWithParsedCast = media.map((item) => ({
      ...item,
      cast: item.cast ? JSON.parse(item.cast) : [],
    }));

    res.json(mediaWithParsedCast);
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

/**
 * POST /api/media
 * Create a new media item (protected)
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const mediaData: MediaItem = req.body;

    // Validate required fields
    if (!mediaData.title || !mediaData.physical_format) {
      return res.status(400).json({ error: 'Title and physical_format are required' });
    }

    // Convert cast array to JSON string if provided
    if (mediaData.cast && typeof mediaData.cast !== 'string') {
      mediaData.cast = JSON.stringify(mediaData.cast);
    }

    const [id] = await db('media').insert(mediaData);
    const newMedia = await db('media').where({ id }).first();

    // Parse cast back to array for response
    if (newMedia.cast) {
      newMedia.cast = JSON.parse(newMedia.cast);
    }

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
    const mediaData: Partial<MediaItem> = req.body;

    // Check if media exists
    const existingMedia = await db('media').where({ id }).first();
    if (!existingMedia) {
      return res.status(404).json({ error: 'Media item not found' });
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

    const updatedMedia = await db('media').where({ id }).first();

    // Parse cast back to array for response
    if (updatedMedia.cast) {
      updatedMedia.cast = JSON.parse(updatedMedia.cast);
    }

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

