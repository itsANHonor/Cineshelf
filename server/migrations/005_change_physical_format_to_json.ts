import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // SQLite doesn't support ALTER COLUMN, so we need to:
  // 1. Add a new column for the JSON array
  // 2. Migrate data from old column to new column
  // 3. Drop old column
  // 4. Rename new column to old name

  // Step 1: Add temporary column
  await knex.schema.table('media', (table) => {
    table.text('physical_format_new').nullable();
  });

  // Step 2: Migrate existing data - convert single format to JSON array
  const media = await knex('media').select('id', 'physical_format');
  
  for (const item of media) {
    // Convert single format string to JSON array
    const formatArray = [item.physical_format];
    await knex('media')
      .where('id', item.id)
      .update({ physical_format_new: JSON.stringify(formatArray) });
  }

  // Step 3 & 4: Create new table without old column, then rename
  await knex.schema.raw(`
    CREATE TABLE media_new (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      tmdb_id INTEGER,
      synopsis TEXT,
      cover_art_url TEXT,
      release_date DATE,
      director TEXT,
      cast TEXT,
      physical_format TEXT NOT NULL DEFAULT '[]',
      edition_notes TEXT,
      region_code TEXT,
      custom_image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Copy data to new table
  await knex.raw(`
    INSERT INTO media_new 
    SELECT 
      id, title, tmdb_id, synopsis, cover_art_url, release_date, 
      director, cast, physical_format_new as physical_format, 
      edition_notes, region_code, custom_image_url, created_at, updated_at
    FROM media
  `);

  // Drop old table and rename new one
  await knex.schema.dropTable('media');
  await knex.schema.renameTable('media_new', 'media');

  // Recreate indexes
  await knex.schema.table('media', (table) => {
    table.index('title');
    table.index('release_date');
    table.index(['tmdb_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Reverse migration: convert JSON arrays back to single format
  
  // Add temporary column
  await knex.schema.table('media', (table) => {
    table.string('physical_format_old').nullable();
  });

  // Migrate data back - take first format from array
  const media = await knex('media').select('id', 'physical_format');
  
  for (const item of media) {
    try {
      const formatArray = JSON.parse(item.physical_format);
      const singleFormat = Array.isArray(formatArray) && formatArray.length > 0 
        ? formatArray[0] 
        : 'Blu-ray'; // Default fallback
      
      await knex('media')
        .where('id', item.id)
        .update({ physical_format_old: singleFormat });
    } catch (e) {
      // If parsing fails, default to Blu-ray
      await knex('media')
        .where('id', item.id)
        .update({ physical_format_old: 'Blu-ray' });
    }
  }

  // Recreate table with VARCHAR column
  await knex.schema.raw(`
    CREATE TABLE media_new (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      tmdb_id INTEGER,
      synopsis TEXT,
      cover_art_url TEXT,
      release_date DATE,
      director TEXT,
      cast TEXT,
      physical_format TEXT NOT NULL,
      edition_notes TEXT,
      region_code TEXT,
      custom_image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Copy data back
  await knex.raw(`
    INSERT INTO media_new 
    SELECT 
      id, title, tmdb_id, synopsis, cover_art_url, release_date, 
      director, cast, physical_format_old as physical_format, 
      edition_notes, region_code, custom_image_url, created_at, updated_at
    FROM media
  `);

  // Drop old and rename
  await knex.schema.dropTable('media');
  await knex.schema.renameTable('media_new', 'media');

  // Recreate indexes
  await knex.schema.table('media', (table) => {
    table.index('title');
    table.index('physical_format');
    table.index('release_date');
    table.index(['tmdb_id']);
  });
}

