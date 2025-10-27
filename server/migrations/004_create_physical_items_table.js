const { Knex } = require('knex');

exports.up = function(knex) {
  return knex.schema.createTable('physical_items', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('physical_format').notNullable(); // JSON array of formats
    table.string('edition_notes').nullable(); // 'Steelbook', 'Collector's Edition', etc.
    table.date('purchase_date').nullable();
    table.text('store_links').nullable(); // JSON array of store URLs
    table.string('custom_image_url').nullable(); // User's photo of physical media
    table.timestamps(true, true); // created_at and updated_at
    
    // Indexes
    table.index('name');
    table.index('purchase_date');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('physical_items');
};
