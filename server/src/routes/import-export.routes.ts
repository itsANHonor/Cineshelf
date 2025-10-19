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
  physical_format: string;
  edition_notes: string | null;
  region_code: string | null;
  custom_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface MediaImportRow {
  title: string;
  tmdb_id?: string | number;
  synopsis?: string;
  cover_art_url?: string;
  release_date?: string;
  director?: string;
  cast?: string;
  physical_format: string;
  edition_notes?: string;
  region_code?: string;
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
        name: 'physical_format',
        type: 'JSON array (string) or single string',
        required: true,
        description: 'Physical format(s) of the media. Can be a single format or JSON array for combo packages.',
        allowed_values: ['4K UHD', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'],
        example: '["4K UHD","Blu-ray"]',
        example_single: 'Blu-ray',
      },
      {
        name: 'tmdb_id',
        type: 'integer',
        required: false,
        description: 'The Movie Database (TMDb) ID',
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
        name: 'edition_notes',
        type: 'string',
        required: false,
        description: 'Edition details like Steelbook, Collector\'s Edition, etc.',
        example: 'Steelbook Edition',
      },
      {
        name: 'region_code',
        type: 'string',
        required: false,
        description: 'Region code for the physical media',
        example: 'Region A',
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
      'For IMPORT: Only title and physical_format are required.',
      'For IMPORT: physical_format can be a single string ("Blu-ray") or JSON array for combos (["4K UHD","Blu-ray"]).',
      'For IMPORT: If a field contains commas, newlines, or quotes, wrap the entire value in double quotes.',
      'For IMPORT: To include a quote character within a quoted field, use two consecutive quotes ("").',
      'For IMPORT: The cast field should be a valid JSON array as a string.',
      'For EXPORT: All fields will be exported including id, created_at, and updated_at.',
      'For EXPORT: physical_format will be exported as JSON array.',
      'For EXPORT: You can re-import an exported CSV - the id, created_at, and updated_at fields will be ignored on import.',
    ],
    example_csv: `title,physical_format,tmdb_id,synopsis,release_date,director,edition_notes
"The Matrix","[""4K UHD"",""Blu-ray""]",603,"A computer hacker learns from mysterious rebels about the true nature of his reality.",1999-03-31,"Lana Wachowski, Lilly Wachowski","4K + Blu-ray Combo"
"Inception","4K UHD",27205,"A thief who steals corporate secrets through the use of dream-sharing technology.",2010-07-16,Christopher Nolan,
"Back to the Future",DVD,105,"Marty McFly, a 17-year-old high school student, is accidentally sent 30 years into the past.",1985-07-03,Robert Zemeckis,`,
  };

  res.json(schema);
});

/**
 * GET /api/import-export/export
 * Export all media items as CSV (protected)
 */
router.get('/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const media = await db('media')
      .select('*')
      .orderBy('created_at', 'desc');

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
      'physical_format',
      'edition_notes',
      'region_code',
      'custom_image_url',
      'created_at',
      'updated_at',
    ];

    const csvLines: string[] = [];
    csvLines.push(headers.join(','));

    // CSV Data
    media.forEach((item: MediaExportRow) => {
      const row = [
        escapeCSV(item.id),
        escapeCSV(item.title),
        escapeCSV(item.tmdb_id),
        escapeCSV(item.synopsis),
        escapeCSV(item.cover_art_url),
        escapeCSV(item.release_date),
        escapeCSV(item.director),
        escapeCSV(item.cast), // Already JSON string in DB
        escapeCSV(item.physical_format),
        escapeCSV(item.edition_notes),
        escapeCSV(item.region_code),
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
    if (!headers.includes('title') || !headers.includes('physical_format')) {
      return res.status(400).json({ 
        error: 'Missing required columns',
        details: 'CSV must include at least "title" and "physical_format" columns'
      });
    }

    const validFormats = ['4K UHD', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'];
    const importResults = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
    };

    // If replace mode, delete existing media
    if (mode === 'replace') {
      await db('media').delete();
    }

    // Parse and import each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      importResults.total++;

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
        if (!rowData.physical_format) {
          throw new Error('Missing required field: physical_format');
        }

        // Parse and validate physical format (can be single string or JSON array)
        let formatArray: string[];
        if (rowData.physical_format.startsWith('[')) {
          // It's a JSON array
          try {
            formatArray = JSON.parse(rowData.physical_format);
            if (!Array.isArray(formatArray)) {
              throw new Error('physical_format must be an array');
            }
          } catch (e) {
            throw new Error(`Invalid JSON in physical_format: ${rowData.physical_format}`);
          }
        } else {
          // Single format string, convert to array
          formatArray = [rowData.physical_format];
        }

        // Validate each format in the array
        for (const format of formatArray) {
          if (!validFormats.includes(format)) {
            throw new Error(`Invalid physical_format: "${format}". Must be one of: ${validFormats.join(', ')}`);
          }
        }

        if (formatArray.length === 0) {
          throw new Error('At least one physical format is required');
        }

        // Prepare media object for insertion
        const mediaData: any = {
          title: rowData.title,
          physical_format: JSON.stringify(formatArray),
        };

        // Optional fields
        if (rowData.tmdb_id) {
          const tmdbId = parseInt(rowData.tmdb_id);
          if (!isNaN(tmdbId)) {
            mediaData.tmdb_id = tmdbId;
          }
        }

        if (rowData.synopsis) mediaData.synopsis = rowData.synopsis;
        if (rowData.cover_art_url) mediaData.cover_art_url = rowData.cover_art_url;
        if (rowData.release_date) {
          // Validate date format
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(rowData.release_date)) {
            mediaData.release_date = rowData.release_date;
          }
        }
        if (rowData.director) mediaData.director = rowData.director;
        if (rowData.cast) {
          // Validate and parse JSON array
          try {
            const castArray = JSON.parse(rowData.cast);
            if (Array.isArray(castArray)) {
              mediaData.cast = JSON.stringify(castArray);
            } else {
              mediaData.cast = rowData.cast; // Store as-is if not valid array
            }
          } catch {
            mediaData.cast = rowData.cast; // Store as-is if not valid JSON
          }
        }
        if (rowData.edition_notes) mediaData.edition_notes = rowData.edition_notes;
        if (rowData.region_code) mediaData.region_code = rowData.region_code;
        if (rowData.custom_image_url) mediaData.custom_image_url = rowData.custom_image_url;

        // Insert into database
        await db('media').insert(mediaData);
        importResults.successful++;

      } catch (error) {
        importResults.failed++;
        importResults.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: lines[i].substring(0, 100), // First 100 chars for reference
        });
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${importResults.successful} items imported successfully.`,
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
    if (!headers.includes('title') || !headers.includes('physical_format')) {
      return res.status(400).json({ 
        error: 'Missing required columns',
        details: 'CSV must include at least "title" and "physical_format" columns',
        valid: false,
        found_headers: headers,
      });
    }

    const validFormats = ['4K UHD', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'];
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

        if (!rowData.physical_format) {
          validationResults.errors.push({
            row: i + 1,
            error: 'Missing required field: physical_format',
          });
          validationResults.valid = false;
        } else {
          // Validate physical_format (can be single string or JSON array)
          let formatArray: string[];
          try {
            if (rowData.physical_format.startsWith('[')) {
              // It's a JSON array
              formatArray = JSON.parse(rowData.physical_format);
              if (!Array.isArray(formatArray)) {
                validationResults.errors.push({
                  row: i + 1,
                  error: 'physical_format must be a string or JSON array',
                });
                validationResults.valid = false;
                continue;
              }
            } else {
              // Single format string
              formatArray = [rowData.physical_format];
            }

            // Validate each format
            for (const format of formatArray) {
              if (!validFormats.includes(format)) {
                validationResults.errors.push({
                  row: i + 1,
                  error: `Invalid physical_format: "${format}". Must be one of: ${validFormats.join(', ')}`,
                });
                validationResults.valid = false;
              }
            }

            if (formatArray.length === 0) {
              validationResults.errors.push({
                row: i + 1,
                error: 'At least one physical format is required',
              });
              validationResults.valid = false;
            }
          } catch (e) {
            validationResults.errors.push({
              row: i + 1,
              error: `Invalid JSON in physical_format: ${rowData.physical_format}`,
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

