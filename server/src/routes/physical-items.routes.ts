import { Router, Request, Response } from 'express';
import { db } from '../database';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

interface PhysicalItem {
  id?: number;
  name: string;
  physical_format: string; // JSON string of array
  edition_notes?: string;
  custom_image_url?: string;
  purchase_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface PhysicalItemWithMedia extends PhysicalItem {
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
  }>;
}

/**
 * GET /api/physical-items
 * Get all physical items with their linked media
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { format, sort_by = 'created_at', sort_order = 'desc' } = req.query;

    // Get all physical items
    let query = db('physical_items').select('*');

    // Filter by format if specified
    if (format && format !== 'all') {
      query = query.where('physical_format', 'like', `%"${format}"%`);
    }

    // Validate and apply sorting
    const validSortColumns = ['name', 'created_at', 'purchase_date'];
    const sortColumn = validSortColumns.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';

    query = query.orderBy(sortColumn as string, sortDirection);

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

        return {
          ...item,
          physical_format: JSON.parse(item.physical_format),
          media,
        };
      })
    );

    res.json(physicalItemsWithMedia);
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
      media,
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching physical item:', error);
    res.status(500).json({ error: 'Failed to fetch physical item' });
  }
});

/**
 * POST /api/physical-items
 * Create a new physical item with linked media (protected)
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, edition_notes, custom_image_url, purchase_date, media } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate media data - support both single object and array
    if (!media) {
      return res.status(400).json({ error: 'Media data is required' });
    }

    // Convert single media object to array for uniform processing
    const mediaArray = Array.isArray(media) ? media : [media];

    if (mediaArray.length === 0) {
      return res.status(400).json({ error: 'At least one media entry is required' });
    }

    const validFormats = ['4K UHD', '3D Blu-ray', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'];

    // Start a transaction
    const result = await db.transaction(async (trx) => {
      // Create physical item first (formats will be calculated after linking media)
      const physicalItemData = {
        name,
        physical_format: JSON.stringify([]), // Will be updated after linking media
        edition_notes,
        custom_image_url,
        purchase_date,
      };

      const [physicalItemId] = await trx('physical_items').insert(physicalItemData);

      // Process each media entry
      const allFormats = new Set<string>();
      
      for (const mediaItem of mediaArray) {
        let mediaId: number;
        
        if (mediaItem.id) {
          // Use existing media entry
          mediaId = mediaItem.id;
        } else {
          // Create new media entry
          if (!mediaItem.title) {
            throw new Error('Media title is required');
          }

          const mediaData: any = {
            title: mediaItem.title,
            tmdb_id: mediaItem.tmdb_id,
            synopsis: mediaItem.synopsis,
            cover_art_url: mediaItem.cover_art_url,
            release_date: mediaItem.release_date,
            director: mediaItem.director,
            cast: mediaItem.cast ? JSON.stringify(mediaItem.cast) : null,
          };

          const [newMediaId] = await trx('media').insert(mediaData);
          mediaId = newMediaId;
        }

        // Validate and process formats for this media item
        let mediaFormats: string[] = [];
        if (mediaItem.formats && Array.isArray(mediaItem.formats)) {
          mediaFormats = mediaItem.formats;
        } else if (mediaItem.format) {
          mediaFormats = [mediaItem.format];
        } else {
          // Default to Blu-ray if no format specified
          mediaFormats = ['Blu-ray'];
        }

        // Validate formats
        for (const format of mediaFormats) {
          if (!validFormats.includes(format)) {
            throw new Error(`Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}`);
          }
          allFormats.add(format);
        }

        // Link physical item to media with formats
        await trx('physical_item_media').insert({
          physical_item_id: physicalItemId,
          media_id: mediaId,
          disc_number: mediaItem.disc_number,
          formats: JSON.stringify(mediaFormats),
        });
      }

      // Update physical item with calculated formats
      await trx('physical_items')
        .where('id', physicalItemId)
        .update({
          physical_format: JSON.stringify(Array.from(allFormats).sort())
        });

      // Fetch the created physical item with media
      const createdItem = await trx('physical_items').where('id', physicalItemId).first();
      const linkedMedia = await trx('physical_item_media')
        .join('media', 'physical_item_media.media_id', 'media.id')
        .where('physical_item_media.physical_item_id', physicalItemId)
        .select('media.*', 'physical_item_media.disc_number', 'physical_item_media.formats');

      return {
        ...createdItem,
        physical_format: JSON.parse(createdItem.physical_format),
        media: linkedMedia.map(m => ({
          ...m,
          cast: m.cast ? JSON.parse(m.cast) : [],
          formats: m.formats ? JSON.parse(m.formats) : [],
        })),
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating physical item:', error);
    res.status(500).json({ error: 'Failed to create physical item' });
  }
});

/**
 * PUT /api/physical-items/:id
 * Update a physical item (protected)
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, physical_format, edition_notes, custom_image_url, purchase_date } = req.body;

    // Check if physical item exists
    const existingItem = await db('physical_items').where('id', id).first();
    if (!existingItem) {
      return res.status(404).json({ error: 'Physical item not found' });
    }

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (edition_notes !== undefined) updateData.edition_notes = edition_notes;
    if (custom_image_url !== undefined) updateData.custom_image_url = custom_image_url;
    if (purchase_date !== undefined) updateData.purchase_date = purchase_date;

    // Handle physical_format
    if (physical_format !== undefined) {
      let formatArray: string[];
      if (Array.isArray(physical_format)) {
        formatArray = physical_format;
      } else if (typeof physical_format === 'string') {
        formatArray = [physical_format];
      } else {
        return res.status(400).json({ error: 'physical_format must be a string or array' });
      }

      const validFormats = ['4K UHD', '3D Blu-ray', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'];
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

      updateData.physical_format = JSON.stringify(formatArray);
    }

    // Update physical item
    await db('physical_items').where('id', id).update(updateData);

    // Fetch updated physical item with media
    const updatedItem = await db('physical_items').where('id', id).first();
    const linkedMedia = await db('physical_item_media')
      .join('media', 'physical_item_media.media_id', 'media.id')
      .where('physical_item_media.physical_item_id', id)
      .select('media.*', 'physical_item_media.disc_number', 'physical_item_media.formats');

    const result: PhysicalItemWithMedia = {
      ...updatedItem,
      physical_format: JSON.parse(updatedItem.physical_format),
      media: linkedMedia.map(m => ({
        ...m,
        cast: m.cast ? JSON.parse(m.cast) : [],
        formats: m.formats ? JSON.parse(m.formats) : [],
      })),
    };

    res.json(result);
  } catch (error) {
    console.error('Error updating physical item:', error);
    res.status(500).json({ error: 'Failed to update physical item' });
  }
});

/**
 * DELETE /api/physical-items/:id
 * Delete a physical item (protected)
 * Note: This deletes the physical item and its links, but keeps the media entry
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if physical item exists
    const existingItem = await db('physical_items').where('id', id).first();
    if (!existingItem) {
      return res.status(404).json({ error: 'Physical item not found' });
    }

    // Delete physical item (CASCADE will delete links automatically)
    await db('physical_items').where('id', id).delete();

    res.json({ message: 'Physical item deleted successfully' });
  } catch (error) {
    console.error('Error deleting physical item:', error);
    res.status(500).json({ error: 'Failed to delete physical item' });
  }
});

/**
 * POST /api/physical-items/:id/media
 * Add a media link to an existing physical item (protected)
 */
router.post('/:id/media', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { media } = req.body;

    // Check if physical item exists
    const existingItem = await db('physical_items').where('id', id).first();
    if (!existingItem) {
      return res.status(404).json({ error: 'Physical item not found' });
    }

    // Validate media data
    if (!media || typeof media !== 'object') {
      return res.status(400).json({ error: 'Media data is required' });
    }

    // Validate formats
    let mediaFormats: string[] = [];
    if (media.formats && Array.isArray(media.formats)) {
      mediaFormats = media.formats;
    } else if (media.format) {
      mediaFormats = [media.format];
    } else {
      mediaFormats = ['Blu-ray']; // Default
    }

    const validFormats = ['4K UHD', '3D Blu-ray', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'];
    for (const format of mediaFormats) {
      if (!validFormats.includes(format)) {
        return res.status(400).json({ 
          error: `Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}` 
        });
      }
    }

    await db.transaction(async (trx) => {
      let mediaId: number;

      if (media.id) {
        // Use existing media entry
        mediaId = media.id;
        
        // Check if already linked
        const existingLink = await trx('physical_item_media')
          .where({ physical_item_id: id, media_id: mediaId })
          .first();
        
        if (existingLink) {
          throw new Error('Media is already linked to this physical item');
        }
      } else {
        // Create new media entry
        if (!media.title) {
          throw new Error('Media title is required');
        }

        const mediaData: any = {
          title: media.title,
          tmdb_id: media.tmdb_id,
          synopsis: media.synopsis,
          cover_art_url: media.cover_art_url,
          release_date: media.release_date,
          director: media.director,
          cast: media.cast ? JSON.stringify(media.cast) : null,
        };

        const [newMediaId] = await trx('media').insert(mediaData);
        mediaId = newMediaId;
      }

      // Create link with formats
      await trx('physical_item_media').insert({
        physical_item_id: id,
        media_id: mediaId,
        disc_number: media.disc_number,
        formats: JSON.stringify(mediaFormats),
      });

      // Recalculate physical item formats
      const allLinkedMedia = await trx('physical_item_media')
        .where('physical_item_id', id)
        .select('formats');
      
      const allFormats = new Set<string>();
      for (const link of allLinkedMedia) {
        if (link.formats) {
          const formats = JSON.parse(link.formats);
          formats.forEach((f: string) => allFormats.add(f));
        }
      }

      await trx('physical_items')
        .where('id', id)
        .update({
          physical_format: JSON.stringify(Array.from(allFormats).sort())
        });
    });

    // Fetch updated physical item with all media
    const updatedItem = await db('physical_items').where('id', id).first();
    const linkedMedia = await db('physical_item_media')
      .join('media', 'physical_item_media.media_id', 'media.id')
      .where('physical_item_media.physical_item_id', id)
      .select('media.*', 'physical_item_media.disc_number', 'physical_item_media.formats');

    const result: PhysicalItemWithMedia = {
      ...updatedItem,
      physical_format: JSON.parse(updatedItem.physical_format),
      media: linkedMedia.map(m => ({
        ...m,
        cast: m.cast ? JSON.parse(m.cast) : [],
        formats: m.formats ? JSON.parse(m.formats) : [],
      })),
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error adding media link:', error);
    res.status(500).json({ error: error.message || 'Failed to add media link' });
  }
});

/**
 * DELETE /api/physical-items/:id/media/:mediaId
 * Remove a media link from a physical item (protected)
 */
router.delete('/:id/media/:mediaId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, mediaId } = req.params;

    // Check if physical item exists
    const existingItem = await db('physical_items').where('id', id).first();
    if (!existingItem) {
      return res.status(404).json({ error: 'Physical item not found' });
    }

    // Check if link exists
    const existingLink = await db('physical_item_media')
      .where({ physical_item_id: id, media_id: mediaId })
      .first();

    if (!existingLink) {
      return res.status(404).json({ error: 'Media link not found' });
    }

    // Check if this is the last media link
    const linkCount = await db('physical_item_media')
      .where('physical_item_id', id)
      .count('* as count')
      .first();

    if (linkCount && parseInt(linkCount.count as string) <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last media link from a physical item' });
    }

    // Delete the link
    await db('physical_item_media')
      .where({ physical_item_id: id, media_id: mediaId })
      .delete();

    // Fetch updated physical item with all media
    const updatedItem = await db('physical_items').where('id', id).first();
    const linkedMedia = await db('physical_item_media')
      .join('media', 'physical_item_media.media_id', 'media.id')
      .where('physical_item_media.physical_item_id', id)
      .select('media.*', 'physical_item_media.disc_number', 'physical_item_media.formats');

    const result: PhysicalItemWithMedia = {
      ...updatedItem,
      physical_format: JSON.parse(updatedItem.physical_format),
      media: linkedMedia.map(m => ({
        ...m,
        cast: m.cast ? JSON.parse(m.cast) : [],
        formats: m.formats ? JSON.parse(m.formats) : [],
      })),
    };

    res.json(result);
  } catch (error) {
    console.error('Error removing media link:', error);
    res.status(500).json({ error: 'Failed to remove media link' });
  }
});

/**
 * POST /api/physical-items/bulk
 * Create multiple physical items (protected)
 */
router.post('/bulk', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }

    if (items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    if (items.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 items allowed per request' });
    }

    const results = await Promise.allSettled(
      items.map(async (item: any) => {
        return db.transaction(async (trx) => {
          // Validate required fields
          if (!item.name || !item.physical_format || !item.media) {
            throw new Error('Name, physical_format, and media are required');
          }

          // Validate physical_format
          let formatArray: string[];
          if (Array.isArray(item.physical_format)) {
            formatArray = item.physical_format;
          } else if (typeof item.physical_format === 'string') {
            formatArray = [item.physical_format];
          } else {
            throw new Error('physical_format must be a string or array');
          }

          const validFormats = ['4K UHD', '3D Blu-ray', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'];
          for (const format of formatArray) {
            if (!validFormats.includes(format)) {
              throw new Error(`Invalid physical format: ${format}`);
            }
          }

          if (formatArray.length === 0) {
            throw new Error('At least one physical format is required');
          }

          // Create or get media entry
          let mediaId: number;
          
          if (item.media.id) {
            mediaId = item.media.id;
          } else {
            if (!item.media.title) {
              throw new Error('Media title is required');
            }

            const mediaData: any = {
              title: item.media.title,
              tmdb_id: item.media.tmdb_id,
              synopsis: item.media.synopsis,
              cover_art_url: item.media.cover_art_url,
              release_date: item.media.release_date,
              director: item.media.director,
              cast: item.media.cast ? JSON.stringify(item.media.cast) : null,
            };

            const [newMediaId] = await trx('media').insert(mediaData);
            mediaId = newMediaId;
          }

          // Create physical item
          const physicalItemData = {
            name: item.name,
            physical_format: JSON.stringify(formatArray),
            edition_notes: item.edition_notes,
            custom_image_url: item.custom_image_url,
            purchase_date: item.purchase_date,
          };

          const [physicalItemId] = await trx('physical_items').insert(physicalItemData);

          // Link physical item to media
          await trx('physical_item_media').insert({
            physical_item_id: physicalItemId,
            media_id: mediaId,
            disc_number: item.media.disc_number,
          });

          // Fetch created item with media
          const createdItem = await trx('physical_items').where('id', physicalItemId).first();
          const linkedMedia = await trx('physical_item_media')
            .join('media', 'physical_item_media.media_id', 'media.id')
            .where('physical_item_media.physical_item_id', physicalItemId)
            .select('media.*', 'physical_item_media.disc_number', 'physical_item_media.formats');

          return {
            success: true,
            physicalItem: {
              ...createdItem,
              physical_format: JSON.parse(createdItem.physical_format),
              media: linkedMedia.map(m => ({
                ...m,
                cast: m.cast ? JSON.parse(m.cast) : [],
              })),
            },
            originalName: item.name,
          };
        });
      })
    );

    const successful: any[] = [];
    const failed: any[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          originalName: items[index].name,
          error: result.reason.message,
        });
      }
    });

    res.status(201).json({
      successful,
      failed,
      summary: {
        total: items.length,
        successful: successful.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error('Error creating bulk physical items:', error);
    res.status(500).json({ error: 'Failed to create physical items' });
  }
});

export default router;

