import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('media', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.integer('tmdb_id').nullable();
    table.text('synopsis').nullable();
    table.string('cover_art_url').nullable();
    table.date('release_date').nullable();
    table.string('director').nullable();
    table.text('cast').nullable(); // JSON string of cast array
    table.string('physical_format').notNullable(); // '4K UHD', 'Blu-ray', 'DVD'
    table.string('edition_notes').nullable(); // 'Steelbook', 'Collector's Edition', etc.
    table.string('region_code').nullable();
    table.string('custom_image_url').nullable(); // User's photo of physical media
    table.timestamps(true, true); // created_at and updated_at
    
    // Indexes for better query performance
    table.index('title');
    table.index('physical_format');
    table.index('release_date');
    table.index(['tmdb_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('media');
}
