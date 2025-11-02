import { Router, Request, Response } from 'express';
import { db } from '../database';

const router = Router();

interface PhysicalItemWithMedia {
  id?: number;
  name: string;
  physical_format: string | string[];
  edition_notes?: string;
  custom_image_url?: string;
  purchase_date?: string;
  store_links?: string | any[];
  created_at?: string;
  updated_at?: string;
  media: Array<{
    id: number;
    title: string;
    tmdb_id?: number;
    synopsis?: string;
    cover_art_url?: string;
    release_date?: string;
    director?: string;
    cast?: string[];
    disc_number?: number;
    formats?: string[];
  }>;
}

/**
 * GET /api/physical-items
 * Get all physical items with their linked media
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { format, sort_by = 'created_at', sort_order = 'desc', search, page = '1', limit = '24' } = req.query;

    // Start with base query with joins for media and series data
    let query = db('physical_items')
      .leftJoin('physical_item_media', 'physical_items.id', 'physical_item_media.physical_item_id')
      .leftJoin('media', 'physical_item_media.media_id', 'media.id')
      .leftJoin('movie_series', 'media.id', 'movie_series.media_id')
      .leftJoin('series', 'movie_series.series_id', 'series.id')
      .select(
        'physical_items.*',
        db.raw('GROUP_CONCAT(DISTINCT media.id) as media_ids'),
        db.raw('GROUP_CONCAT(DISTINCT media.title) as media_titles'),
        db.raw('GROUP_CONCAT(DISTINCT media.director) as media_directors'),
        db.raw('GROUP_CONCAT(DISTINCT media.release_date) as media_release_dates'),
        db.raw('MIN(media.release_date) as earliest_release_date'),
        db.raw('GROUP_CONCAT(DISTINCT series.id) as series_ids'),
        db.raw('GROUP_CONCAT(DISTINCT series.name) as series_names'),
        db.raw('GROUP_CONCAT(DISTINCT series.sort_name) as series_sort_names')
      )
      .groupBy('physical_items.id');

    // Filter by format if specified
    if (format && format !== 'all') {
      query = query.where('physical_items.physical_format', 'like', `%"${format}"%`);
    }

    // Search functionality
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(function() {
        this.where('physical_items.name', 'like', searchTerm)
          .orWhere('media.title', 'like', searchTerm)
          .orWhere('media.director', 'like', searchTerm)
          .orWhere('media.synopsis', 'like', searchTerm)
          .orWhere('physical_items.edition_notes', 'like', searchTerm)
          .orWhereRaw(`EXISTS (
            SELECT 1 FROM json_each(media.cast) 
            WHERE json_each.value LIKE ?
          )`, [searchTerm]);
      });
    }

    // Apply sorting based on sort_by parameter
    const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';
    
    if (sort_by === 'title') {
      // Sort by physical item name
      query = query.orderBy('physical_items.name', sortDirection);
    } else if (sort_by === 'series_sort') {
      // Sort by series sort name OR physical item name (intermixed alphabetically)
      query = query.orderByRaw(`COALESCE(series.sort_name, physical_items.name) ${sortDirection.toUpperCase()}`);
    } else if (sort_by === 'director_last_name') {
      // Extract last name from first media's director field and sort by it
      query = query.orderByRaw(`
        CASE 
          WHEN media.director IS NOT NULL AND media.director != '' 
          THEN SUBSTR(media.director, INSTR(media.director, ' ') + 1)
          ELSE media.director
        END ${sortDirection.toUpperCase()} NULLS LAST
      `);
    } else if (sort_by === 'release_date') {
      // Sort by earliest release date among linked media
      query = query.orderByRaw(`MIN(media.release_date) ${sortDirection.toUpperCase()} NULLS LAST`);
    } else if (sort_by === 'physical_format') {
      // Sort by physical format
      query = query.orderBy('physical_items.physical_format', sortDirection);
    } else {
      // Default to created_at
      query = query.orderBy('physical_items.created_at', sortDirection);
    }

    // Get total count for pagination - create a separate query to avoid GROUP BY issues
    let countQuery = db('physical_items')
      .leftJoin('physical_item_media', 'physical_items.id', 'physical_item_media.physical_item_id')
      .leftJoin('media', 'physical_item_media.media_id', 'media.id')
      .leftJoin('movie_series', 'media.id', 'movie_series.media_id')
      .leftJoin('series', 'movie_series.series_id', 'series.id');

    // Apply the same filters as the main query
    if (format && format !== 'all') {
      countQuery = countQuery.where('physical_items.physical_format', 'like', `%"${format}"%`);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      countQuery = countQuery.where(function() {
        this.where('physical_items.name', 'like', searchTerm)
          .orWhere('media.title', 'like', searchTerm)
          .orWhere('media.director', 'like', searchTerm)
          .orWhere('media.synopsis', 'like', searchTerm)
          .orWhere('physical_items.edition_notes', 'like', searchTerm)
          .orWhereRaw(`EXISTS (
            SELECT 1 FROM json_each(media.cast) 
            WHERE json_each.value LIKE ?
          )`, [searchTerm]);
      });
    }

    const totalCount = await countQuery.countDistinct('physical_items.id as count').first();
    const total = totalCount ? parseInt(totalCount.count as string) : 0;

    // Calculate pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(total / limitNum);

    // Apply pagination
    query = query.limit(limitNum).offset(offset);

    const physicalItems = await query;

    // Get linked media for each physical item
    const physicalItemsWithMedia: PhysicalItemWithMedia[] = await Promise.all(
      physicalItems.map(async (item) => {
        const linkedMedia = await db('physical_item_media')
          .join('media', 'physical_item_media.media_id', 'media.id')
          .where('physical_item_media.physical_item_id', item.id)
          .select(
            'media.*',
            'physical_item_media.disc_number',
            'physical_item_media.formats'
          );

        // Parse JSON fields
        const media = linkedMedia.map(m => ({
          ...m,
          cast: m.cast ? JSON.parse(m.cast) : [],
          formats: m.formats ? JSON.parse(m.formats) : [],
        }));

        // Clean up the aggregated fields from the main query
        const cleanedItem = {
          ...item,
          physical_format: JSON.parse(item.physical_format),
          store_links: item.store_links ? JSON.parse(item.store_links) : [],
          media,
          // Remove aggregated fields that are not needed in response
          media_ids: undefined,
          media_titles: undefined,
          media_directors: undefined,
          media_release_dates: undefined,
          earliest_release_date: undefined,
          series_ids: undefined,
          series_names: undefined,
          series_sort_names: undefined,
        };

        return cleanedItem;
      })
    );

    res.json({
      items: physicalItemsWithMedia,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching physical items:', error);
    res.status(500).json({ error: 'Failed to fetch physical items' });
  }
});

/**
 * GET /api/physical-items/:id
 * Get a specific physical item with its linked media
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const physicalItem = await db('physical_items').where('id', id).first();

    if (!physicalItem) {
      return res.status(404).json({ error: 'Physical item not found' });
    }

    // Get linked media
    const linkedMedia = await db('physical_item_media')
      .join('media', 'physical_item_media.media_id', 'media.id')
      .where('physical_item_media.physical_item_id', id)
      .select(
        'media.*',
        'physical_item_media.disc_number',
        'physical_item_media.formats'
      );

    // Parse JSON fields
    const media = linkedMedia.map(m => ({
      ...m,
      cast: m.cast ? JSON.parse(m.cast) : [],
      formats: m.formats ? JSON.parse(m.formats) : [],
    }));

    const result: PhysicalItemWithMedia = {
      ...physicalItem,
      physical_format: JSON.parse(physicalItem.physical_format),
      store_links: physicalItem.store_links ? JSON.parse(physicalItem.store_links) : [],
      media,
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching physical item:', error);
    res.status(500).json({ error: 'Failed to fetch physical item' });
  }
});

export default router;

