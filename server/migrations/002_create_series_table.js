const { Knex } = require('knex');

exports.up = function(knex) {
  return knex.schema.createTable('series', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('sort_name').nullable(); // For custom sorting
    table.text('description').nullable();
    table.string('cover_art_url').nullable();
    table.timestamps(true, true); // created_at and updated_at
    
    // Indexes
    table.index('name');
    table.index('sort_name');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('series');
};
