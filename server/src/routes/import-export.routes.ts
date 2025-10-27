import { Router, Request, Response } from 'express';
import { db } from '../database';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

interface MediaExportRow {
  id: number;
  title: string;
  tmdb_id: number | null;
  synopsis: string | null;
  cover_art_url: string | null;
  release_date: string | null;
  director: string | null;
  cast: string | null;
  physical_item_name: string;
  formats: string;
  disc_number: number | null;
  edition_notes: string | null;
  purchase_date: string | null;
  store_links: string | null;
  custom_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface MediaImportRow {
  title: string;
  physical_item_name: string;
  formats: string;
  tmdb_id?: string | number;
  synopsis?: string;
  cover_art_url?: string;
  release_date?: string;
  director?: string;
  cast?: string;
  disc_number?: string | number;
  edition_notes?: string;
  purchase_date?: string;
  store_links?: string;
  custom_image_url?: string;
}

/**
 * Helper function to escape CSV values
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // If the value contains comma, newline, or double quote, wrap it in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Helper function to parse CSV line
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Helper function to group array of objects by a key
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * GET /api/import-export/schema
 * Get the CSV import schema documentation
 */
router.get('/schema', (req: Request, res: Response) => {
  const schema = {
    description: 'CSV Import/Export Schema for Cineshelf Media Collection',
    format: 'CSV (Comma-Separated Values)',
    encoding: 'UTF-8',
    fields: [
      {
        name: 'title',
        type: 'string',
        required: true,
        description: 'The title of the media item',
        example: 'The Matrix',
      },
      {
        name: 'physical_item_name',
        type: 'string',
        required: true,
        description: 'Name of the physical item (e.g., "Back to the Future Box Set"). Multiple movies can share the same physical item.',
        example: 'Back to the Future Trilogy',
      },
      {
        name: 'formats',
        type: 'JSON array (string)',
        required: true,
        description: 'Physical format(s) for this specific movie. JSON array of formats.',
        allowed_values: ['4K UHD', '3D Blu-ray', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'],
        example: '["Blu-ray","DVD"]',
      },
      {
        name: 'tmdb_id',
        type: 'integer',
        required: false,
        description: 'The Movie Database (TMDb) ID. If provided and a movie with this ID exists, it will be reused instead of creating a new entry.',
        example: '603',
      },
      {
        name: 'synopsis',
        type: 'text',
        required: false,
        description: 'Plot synopsis or description',
        example: 'A computer hacker learns from mysterious rebels...',
      },
      {
        name: 'cover_art_url',
        type: 'string (URL)',
        required: false,
        description: 'URL to cover art image (typically from TMDb)',
        example: 'https://image.tmdb.org/t/p/w500/...',
      },
      {
        name: 'release_date',
        type: 'date',
        required: false,
        description: 'Release date in YYYY-MM-DD format',
        example: '1999-03-31',
      },
      {
        name: 'director',
        type: 'string',
        required: false,
        description: 'Director name(s)',
        example: 'Lana Wachowski, Lilly Wachowski',
      },
      {
        name: 'cast',
        type: 'JSON array (string)',
        required: false,
        description: 'Cast members as JSON array string',
        example: '["Keanu Reeves","Laurence Fishburne","Carrie-Anne Moss"]',
      },
      {
        name: 'disc_number',
        type: 'integer',
        required: false,
        description: 'Disc number within the physical item (for multi-disc sets)',
        example: '1',
      },
      {
        name: 'edition_notes',
        type: 'string',
        required: false,
        description: 'Edition details like Steelbook, Collector\'s Edition, etc.',
        example: 'Steelbook Edition',
      },
      {
        name: 'purchase_date',
        type: 'date',
        required: false,
        description: 'Purchase date of the physical item in YYYY-MM-DD format',
        example: '2023-12-01',
      },
      {
        name: 'store_links',
        type: 'JSON array (string)',
        required: false,
        description: 'Store links for the physical item as JSON array',
        example: '["https://amazon.com/item","https://bestbuy.com/item"]',
      },
      {
        name: 'custom_image_url',
        type: 'string (URL)',
        required: false,
        description: 'URL to custom uploaded image of your physical media',
        example: '/uploads/my-photo.jpg',
      },
    ],
    notes: [
      'For IMPORT: Only title, physical_item_name, and formats are required.',
      'For IMPORT: Multiple movies can share the same physical_item_name to create box sets or multi-disc collections.',
      'For IMPORT: If tmdb_id is provided and matches an existing movie, that movie will be reused instead of creating a duplicate.',
      'For IMPORT: The physical item\'s overall formats will be automatically calculated from all movies\' formats.',
      'For IMPORT: If a field contains commas, newlines, or quotes, wrap the entire value in double quotes.',
      'For IMPORT: To include a quote character within a quoted field, use two consecutive quotes ("").',
      'For IMPORT: The cast and store_links fields should be valid JSON arrays as strings.',
      'For EXPORT: All fields will be exported including id, created_at, and updated_at.',
      'For EXPORT: Each row represents one movie, with physical item details duplicated for movies in the same physical item.',
      'For EXPORT: You can re-import an exported CSV - the id, created_at, and updated_at fields will be ignored on import.',
    ],
    example_csv: `title,physical_item_name,formats,tmdb_id,director,disc_number,edition_notes
"Back to the Future","Back to the Future Trilogy","[""Blu-ray"",""DVD""]",105,"Robert Zemeckis",1,"Box Set"
"Back to the Future Part II","Back to the Future Trilogy","[""Blu-ray"",""DVD""]",165,"Robert Zemeckis",2,"Box Set"
"The Matrix","The Matrix","[""4K UHD"",""Blu-ray""]",603,"Lana Wachowski, Lilly Wachowski",1,"4K Combo Pack"`,
  };

  res.json(schema);
});

/**
 * GET /api/import-export/export
 * Export all media items as CSV (protected)
 */
router.get('/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Query from physical_items table with joins to physical_item_media and media
    // Each row in CSV represents one movie (not one physical item)
    const items = await db('physical_item_media')
      .join('physical_items', 'physical_item_media.physical_item_id', 'physical_items.id')
      .join('media', 'physical_item_media.media_id', 'media.id')
      .select(
        'physical_items.name as physical_item_name',
        'physical_items.edition_notes',
        'physical_items.purchase_date',
        'physical_items.store_links',
        'physical_items.custom_image_url',
        'physical_items.created_at',
        'physical_items.updated_at',
        'physical_item_media.disc_number',
        'physical_item_media.formats',
        'media.id',
        'media.title',
        'media.tmdb_id',
        'media.synopsis',
        'media.cover_art_url',
        'media.release_date',
        'media.director',
        'media.cast'
      )
      .orderBy('physical_items.created_at', 'desc')
      .orderBy('physical_item_media.disc_number', 'asc');

    // CSV Header
    const headers = [
      'id',
      'title',
      'tmdb_id',
      'synopsis',
      'cover_art_url',
      'release_date',
      'director',
      'cast',
      'physical_item_name',
      'formats',
      'disc_number',
      'edition_notes',
      'purchase_date',
      'store_links',
      'custom_image_url',
      'created_at',
      'updated_at',
    ];

    const csvLines: string[] = [];
    csvLines.push(headers.join(','));

    // CSV Data
    items.forEach((item: MediaExportRow) => {
      const row = [
        escapeCSV(item.id),
        escapeCSV(item.title),
        escapeCSV(item.tmdb_id),
        escapeCSV(item.synopsis),
        escapeCSV(item.cover_art_url),
        escapeCSV(item.release_date),
        escapeCSV(item.director),
        escapeCSV(item.cast), // Already JSON string in DB
        escapeCSV(item.physical_item_name),
        escapeCSV(item.formats), // Already JSON string in DB
        escapeCSV(item.disc_number),
        escapeCSV(item.edition_notes),
        escapeCSV(item.purchase_date),
        escapeCSV(item.store_links), // Already JSON string in DB
        escapeCSV(item.custom_image_url),
        escapeCSV(item.created_at),
        escapeCSV(item.updated_at),
      ];
      csvLines.push(row.join(','));
    });

    const csv = csvLines.join('\n');

    // Set headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cineshelf-export-${timestamp}.csv"`);
    
    res.send(csv);
  } catch (error) {
    console.error('Error exporting media:', error);
    res.status(500).json({ error: 'Failed to export media collection' });
  }
});

/**
 * POST /api/import-export/import
 * Import media items from CSV (protected)
 */
router.post('/import', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { csv_data, mode = 'add' } = req.body;

    if (!csv_data || typeof csv_data !== 'string') {
      return res.status(400).json({ 
        error: 'CSV data is required',
        details: 'Request body must include csv_data field with CSV content as string'
      });
    }

    if (!['add', 'replace'].includes(mode)) {
      return res.status(400).json({ 
        error: 'Invalid import mode',
        details: 'Mode must be either "add" or "replace"'
      });
    }

    const lines = csv_data.trim().split('\n');
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid CSV format',
        details: 'CSV must have at least a header row and one data row'
      });
    }

    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.trim());

    // Validate required headers
    if (!headers.includes('title') || !headers.includes('physical_item_name') || !headers.includes('formats')) {
      return res.status(400).json({ 
        error: 'Missing required columns',
        details: 'CSV must include at least "title", "physical_item_name", and "formats" columns'
      });
    }

    const validFormats = ['4K UHD', '3D Blu-ray', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'];
    const importResults = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
    };

    // If replace mode, delete existing physical items and their links
    if (mode === 'replace') {
        await db.transaction(async (trx: any) => {
          await trx('physical_item_media').delete();
          await trx('physical_items').delete();
        });
    }

    // Parse CSV rows
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      try {
        const values = parseCSVLine(line);
        const rowData: any = {};

        // Map values to headers
        headers.forEach((header, index) => {
          const value = values[index]?.trim();
          if (value) {
            rowData[header] = value;
          }
        });

        // Validate required fields
        if (!rowData.title) {
          throw new Error('Missing required field: title');
        }
        if (!rowData.physical_item_name) {
          throw new Error('Missing required field: physical_item_name');
        }
        if (!rowData.formats) {
          throw new Error('Missing required field: formats');
        }

        // Parse and validate formats
        let formatArray: string[];
        try {
          formatArray = JSON.parse(rowData.formats);
          if (!Array.isArray(formatArray)) {
            throw new Error('formats must be a JSON array');
          }
        } catch (e) {
          throw new Error(`Invalid JSON in formats: ${rowData.formats}`);
        }

        // Validate each format in the array
        for (const format of formatArray) {
          if (!validFormats.includes(format)) {
            throw new Error(`Invalid format: "${format}". Must be one of: ${validFormats.join(', ')}`);
          }
        }

        if (formatArray.length === 0) {
          throw new Error('At least one format is required');
        }

        // Parse optional fields
        if (rowData.tmdb_id) {
          const tmdbId = parseInt(rowData.tmdb_id);
          if (!isNaN(tmdbId)) {
            rowData.tmdb_id = tmdbId;
          }
        }

        if (rowData.disc_number) {
          const discNumber = parseInt(rowData.disc_number);
          if (!isNaN(discNumber)) {
            rowData.disc_number = discNumber;
          }
        }

        if (rowData.cast) {
          try {
            JSON.parse(rowData.cast); // Validate JSON
          } catch {
            throw new Error(`Invalid JSON in cast: ${rowData.cast}`);
          }
        }

        if (rowData.store_links) {
          try {
            JSON.parse(rowData.store_links); // Validate JSON
          } catch {
            throw new Error(`Invalid JSON in store_links: ${rowData.store_links}`);
          }
        }

        if (rowData.release_date) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(rowData.release_date)) {
            throw new Error(`release_date format should be YYYY-MM-DD, got: ${rowData.release_date}`);
          }
        }

        if (rowData.purchase_date) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(rowData.purchase_date)) {
            throw new Error(`purchase_date format should be YYYY-MM-DD, got: ${rowData.purchase_date}`);
          }
        }

        rows.push(rowData);
        importResults.total++;

      } catch (error) {
        importResults.failed++;
        importResults.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: lines[i].substring(0, 100), // First 100 chars for reference
        });
      }
    }

    // Group rows by physical_item_name
    const grouped = groupBy(rows, 'physical_item_name');

    // Process each physical item group
    for (const [itemName, movies] of Object.entries(grouped)) {
      try {
        await db.transaction(async (trx: any) => {
          // Find or create physical item
          let physicalItem = await trx('physical_items').where('name', itemName).first();
          
          if (!physicalItem) {
            // Create new physical item
            const physicalItemData = {
              name: itemName,
              physical_format: JSON.stringify([]), // Will be updated after processing movies
              edition_notes: movies[0].edition_notes || null,
              purchase_date: movies[0].purchase_date || null,
              store_links: movies[0].store_links || null,
              custom_image_url: movies[0].custom_image_url || null,
            };

            const [physicalItemId] = await trx('physical_items').insert(physicalItemData);
            physicalItem = { id: physicalItemId, ...physicalItemData };
          }

          const allFormats = new Set<string>();
          
          // Process each movie in this physical item
          for (const movie of movies) {
            let mediaId: number | undefined;
            
            // Parse formats for this movie
            let formatArray: string[];
            try {
              formatArray = JSON.parse(movie.formats);
            } catch (e) {
              throw new Error(`Invalid JSON in formats for movie "${movie.title}": ${movie.formats}`);
            }
            
            // Find existing media by tmdb_id if provided
            if (movie.tmdb_id) {
              const existingMedia = await trx('media').where('tmdb_id', movie.tmdb_id).first();
              if (existingMedia) {
                mediaId = existingMedia.id;
              }
            }
            
            // Create new media entry if not found
            if (!mediaId) {
              const mediaData: any = {
                title: movie.title,
                tmdb_id: movie.tmdb_id || null,
                synopsis: movie.synopsis || null,
                cover_art_url: movie.cover_art_url || null,
                release_date: movie.release_date || null,
                director: movie.director || null,
                cast: movie.cast || null,
              };

              const [newMediaId] = await trx('media').insert(mediaData);
              mediaId = newMediaId;
            }

            // Create physical_item_media link
            await trx('physical_item_media').insert({
              physical_item_id: physicalItem.id,
              media_id: mediaId,
              disc_number: movie.disc_number || 1,
              formats: JSON.stringify(formatArray),
            });

            // Collect formats for physical item
            formatArray.forEach((f: string) => allFormats.add(f));
          }

          // Update physical item with calculated formats
          await trx('physical_items').where('id', physicalItem.id).update({
            physical_format: JSON.stringify(Array.from(allFormats).sort())
          });
        });

        importResults.successful++;

      } catch (error) {
        importResults.failed++;
        importResults.errors.push({
          row: 0, // Group-level error
          error: error instanceof Error ? error.message : 'Unknown error',
          data: `Physical item: ${itemName}`,
        });
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${importResults.successful} physical items processed successfully.`,
      results: importResults,
    });

  } catch (error) {
    console.error('Error importing media:', error);
    res.status(500).json({ 
      error: 'Failed to import media collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/import-export/validate
 * Validate CSV without importing (protected)
 */
router.post('/validate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { csv_data } = req.body;

    if (!csv_data || typeof csv_data !== 'string') {
      return res.status(400).json({ 
        error: 'CSV data is required',
        details: 'Request body must include csv_data field with CSV content as string'
      });
    }

    const lines = csv_data.trim().split('\n');
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid CSV format',
        details: 'CSV must have at least a header row and one data row',
        valid: false,
      });
    }

    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.trim());

    // Validate required headers
    if (!headers.includes('title') || !headers.includes('physical_item_name') || !headers.includes('formats')) {
      return res.status(400).json({ 
        error: 'Missing required columns',
        details: 'CSV must include at least "title", "physical_item_name", and "formats" columns',
        valid: false,
        found_headers: headers,
      });
    }

    const validFormats = ['4K UHD', '3D Blu-ray', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'];
    const validationResults = {
      valid: true,
      total_rows: lines.length - 1,
      warnings: [] as Array<{ row: number; warning: string }>,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Validate each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVLine(line);
        const rowData: any = {};

        headers.forEach((header, index) => {
          const value = values[index]?.trim();
          if (value) {
            rowData[header] = value;
          }
        });

        // Check required fields
        if (!rowData.title) {
          validationResults.errors.push({
            row: i + 1,
            error: 'Missing required field: title',
          });
          validationResults.valid = false;
        }

        if (!rowData.physical_item_name) {
          validationResults.errors.push({
            row: i + 1,
            error: 'Missing required field: physical_item_name',
          });
          validationResults.valid = false;
        }

        if (!rowData.formats) {
          validationResults.errors.push({
            row: i + 1,
            error: 'Missing required field: formats',
          });
          validationResults.valid = false;
        } else {
          // Validate formats (must be JSON array)
          try {
            const formatArray = JSON.parse(rowData.formats);
            if (!Array.isArray(formatArray)) {
              validationResults.errors.push({
                row: i + 1,
                error: 'formats must be a JSON array',
              });
              validationResults.valid = false;
            } else {
              // Validate each format
              for (const format of formatArray) {
                if (!validFormats.includes(format)) {
                  validationResults.errors.push({
                    row: i + 1,
                    error: `Invalid format: "${format}". Must be one of: ${validFormats.join(', ')}`,
                  });
                  validationResults.valid = false;
                }
              }

              if (formatArray.length === 0) {
                validationResults.errors.push({
                  row: i + 1,
                  error: 'At least one format is required',
                });
                validationResults.valid = false;
              }
            }
          } catch (e) {
            validationResults.errors.push({
              row: i + 1,
              error: `Invalid JSON in formats: ${rowData.formats}`,
            });
            validationResults.valid = false;
          }
        }

        // Check optional field formats
        if (rowData.release_date) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(rowData.release_date)) {
            validationResults.warnings.push({
              row: i + 1,
              warning: `release_date format should be YYYY-MM-DD, got: ${rowData.release_date}`,
            });
          }
        }

        if (rowData.purchase_date) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(rowData.purchase_date)) {
            validationResults.warnings.push({
              row: i + 1,
              warning: `purchase_date format should be YYYY-MM-DD, got: ${rowData.purchase_date}`,
            });
          }
        }

        if (rowData.cast) {
          try {
            const castArray = JSON.parse(rowData.cast);
            if (!Array.isArray(castArray)) {
              validationResults.warnings.push({
                row: i + 1,
                warning: 'cast should be a JSON array',
              });
            }
          } catch {
            validationResults.warnings.push({
              row: i + 1,
              warning: 'cast is not valid JSON',
            });
          }
        }

        if (rowData.store_links) {
          try {
            const storeLinksArray = JSON.parse(rowData.store_links);
            if (!Array.isArray(storeLinksArray)) {
              validationResults.warnings.push({
                row: i + 1,
                warning: 'store_links should be a JSON array',
              });
            }
          } catch {
            validationResults.warnings.push({
              row: i + 1,
              warning: 'store_links is not valid JSON',
            });
          }
        }

        if (rowData.tmdb_id) {
          const tmdbId = parseInt(rowData.tmdb_id);
          if (isNaN(tmdbId)) {
            validationResults.warnings.push({
              row: i + 1,
              warning: `tmdb_id should be a number, got: ${rowData.tmdb_id}`,
            });
          }
        }

        if (rowData.disc_number) {
          const discNumber = parseInt(rowData.disc_number);
          if (isNaN(discNumber)) {
            validationResults.warnings.push({
              row: i + 1,
              warning: `disc_number should be a number, got: ${rowData.disc_number}`,
            });
          }
        }

      } catch (error) {
        validationResults.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Failed to parse row',
        });
        validationResults.valid = false;
      }
    }

    res.json(validationResults);

  } catch (error) {
    console.error('Error validating CSV:', error);
    res.status(500).json({ 
      error: 'Failed to validate CSV',
      details: error instanceof Error ? error.message : 'Unknown error',
      valid: false,
    });
  }
});

export default router;

