/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('series', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('sort_name').notNullable();
      table.integer('tmdb_collection_id').nullable();
      table.timestamps(true, true);
      
      // Indexes
      table.index('name');
      table.index('sort_name');
      table.index('tmdb_collection_id');
    })
    .createTable('movie_series', (table) => {
      table.increments('id').primary();
      table.integer('media_id').unsigned().notNullable();
      table.integer('series_id').unsigned().notNullable();
      table.integer('sort_order').nullable();
      table.boolean('auto_sort').defaultTo(true);
      table.timestamps(true, true);
      
      // Foreign keys
      table.foreign('media_id').references('media.id').onDelete('CASCADE');
      table.foreign('series_id').references('series.id').onDelete('CASCADE');
      
      // Indexes
      table.index('media_id');
      table.index('series_id');
      table.index(['series_id', 'sort_order']);
      
      // Unique constraint to prevent duplicate associations
      table.unique(['media_id', 'series_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('movie_series')
    .dropTableIfExists('series');
};


