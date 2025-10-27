const { Knex } = require('knex');

exports.up = function(knex) {
  return knex.schema.createTable('movie_series', (table) => {
    table.increments('id').primary();
    table.integer('media_id').notNullable();
    table.integer('series_id').notNullable();
    table.integer('sort_order').nullable(); // Manual sort order
    table.boolean('auto_sort').defaultTo(true); // Whether to auto-sort by release date
    table.timestamps(true, true); // created_at and updated_at
    
    // Foreign key constraints
    table.foreign('media_id').references('id').inTable('media').onDelete('CASCADE');
    table.foreign('series_id').references('id').inTable('series').onDelete('CASCADE');
    
    // Indexes
    table.index(['media_id']);
    table.index(['series_id']);
    table.index(['series_id', 'sort_order']);
    
    // Unique constraint to prevent duplicate associations
    table.unique(['media_id', 'series_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('movie_series');
};
