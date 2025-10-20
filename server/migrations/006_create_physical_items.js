/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create physical_items table
    .createTable('physical_items', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable(); // User-customizable name
      table.text('physical_format').notNullable(); // JSON array: ["4K UHD", "Blu-ray"]
      table.string('edition_notes').nullable(); // e.g., "Steelbook", "Director's Cut"
      table.string('custom_image_url').nullable(); // User's photo of physical item
      table.date('purchase_date').nullable();
      table.timestamps(true, true); // created_at and updated_at
      
      // Indexes for better query performance
      table.index('name');
      table.index('created_at');
    })
    // Create junction table for many-to-many relationship
    .createTable('physical_item_media', (table) => {
      table.increments('id').primary();
      table.integer('physical_item_id').unsigned().notNullable();
      table.integer('media_id').unsigned().notNullable();
      table.integer('disc_number').nullable(); // For multi-disc sets
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Foreign keys
      table.foreign('physical_item_id').references('physical_items.id').onDelete('CASCADE');
      table.foreign('media_id').references('media.id').onDelete('CASCADE');
      
      // Indexes
      table.index('physical_item_id');
      table.index('media_id');
      table.unique(['physical_item_id', 'media_id']); // Prevent duplicate links
    })
    // Modify media table to remove physical format columns
    .then(() => {
      // Check if media table exists and has data to migrate
      return knex.schema.hasTable('media').then((exists) => {
        if (!exists) {
          // Fresh install - create media table with new structure
          return knex.schema.createTable('media', (table) => {
            table.increments('id').primary();
            table.string('title').notNullable();
            table.integer('tmdb_id').nullable();
            table.text('synopsis').nullable();
            table.string('cover_art_url').nullable();
            table.date('release_date').nullable();
            table.string('director').nullable();
            table.text('cast').nullable(); // JSON array
            table.timestamps(true, true);
            
            table.index('title');
            table.index('release_date');
            table.index('tmdb_id');
          });
        } else {
          // Existing media table - check if it needs migration
          return knex('media').count('* as count').first()
            .then((result) => {
              const hasData = result && result.count > 0;
              
              // Create new table structure
              return knex.schema.raw(`
                CREATE TABLE media_new (
                  id INTEGER PRIMARY KEY,
                  title TEXT NOT NULL,
                  tmdb_id INTEGER,
                  synopsis TEXT,
                  cover_art_url TEXT,
                  release_date DATE,
                  director TEXT,
                  cast TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `)
              .then(() => {
                if (hasData) {
                  // Migrate data and create physical items
                  return knex.raw('INSERT INTO media_new (id, title, tmdb_id, synopsis, cover_art_url, release_date, director, "cast", created_at, updated_at) SELECT id, title, tmdb_id, synopsis, cover_art_url, release_date, director, "cast", created_at, updated_at FROM media')
                  .then(() => {
                    // Create physical items from old media entries
                    return knex.raw(`
                      INSERT INTO physical_items (name, physical_format, edition_notes, custom_image_url, created_at, updated_at)
                      SELECT 
                        title || ' ' || CASE 
                          WHEN physical_format LIKE '%"4K UHD"%' THEN '4K UHD'
                          WHEN physical_format LIKE '%Blu-ray%' THEN 'Blu-ray'
                          WHEN physical_format LIKE '%DVD%' THEN 'DVD'
                          WHEN physical_format LIKE '%LaserDisc%' THEN 'LaserDisc'
                          WHEN physical_format LIKE '%VHS%' THEN 'VHS'
                          ELSE 'Physical Media'
                        END as name,
                        physical_format,
                        edition_notes,
                        custom_image_url,
                        created_at,
                        updated_at
                      FROM media
                    `);
                  })
                  .then(() => {
                    // Link physical items to media
                    return knex.raw(`
                      INSERT INTO physical_item_media (physical_item_id, media_id, created_at)
                      SELECT p.id, m.id, m.created_at
                      FROM physical_items p
                      JOIN media_new m ON (
                        p.name LIKE m.title || '%' 
                        AND p.created_at = m.created_at
                      )
                    `);
                  });
                }
                return Promise.resolve();
              })
              .then(() => knex.schema.dropTable('media'))
              .then(() => knex.schema.renameTable('media_new', 'media'))
              .then(() => {
                return knex.schema.table('media', (table) => {
                  table.index('title');
                  table.index('release_date');
                  table.index('tmdb_id');
                });
              });
            });
        }
      });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Reverse migration: restore original media table structure
  return knex.schema
    .raw(`
      CREATE TABLE media_old (
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
    `)
    .then(() => {
      // Copy data back and restore physical format info from physical_items
      return knex.raw(`
        INSERT INTO media_old (id, title, tmdb_id, synopsis, cover_art_url, release_date, director, cast, 
                               physical_format, edition_notes, custom_image_url, created_at, updated_at)
        SELECT m.id, m.title, m.tmdb_id, m.synopsis, m.cover_art_url, m.release_date, m.director, m.cast,
               p.physical_format, p.edition_notes, p.custom_image_url, m.created_at, m.updated_at
        FROM media m
        JOIN physical_item_media pim ON m.id = pim.media_id
        JOIN physical_items p ON pim.physical_item_id = p.id
      `);
    })
    .then(() => knex.schema.dropTable('media'))
    .then(() => knex.schema.renameTable('media_old', 'media'))
    .then(() => {
      return knex.schema.table('media', (table) => {
        table.index('title');
        table.index('physical_format');
        table.index('release_date');
        table.index(['tmdb_id']);
      });
    })
    .then(() => knex.schema.dropTableIfExists('physical_item_media'))
    .then(() => knex.schema.dropTableIfExists('physical_items'));
};

