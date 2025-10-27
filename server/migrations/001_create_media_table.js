const { Knex } = require('knex');

exports.up = function(knex) {
  return knex.schema.createTable('media', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.integer('tmdb_id').nullable();
    table.text('synopsis').nullable();
    table.string('cover_art_url').nullable();
    table.date('release_date').nullable();
    table.string('director').nullable();
    table.text('cast').nullable(); // JSON string of cast array
    table.timestamps(true, true); // created_at and updated_at
    
    // Indexes for better query performance
    table.index('title');
    table.index('release_date');
    table.index(['tmdb_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('media');
};
