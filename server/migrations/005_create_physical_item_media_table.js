const { Knex } = require('knex');

exports.up = function(knex) {
  return knex.schema.createTable('physical_item_media', (table) => {
    table.increments('id').primary();
    table.integer('physical_item_id').notNullable();
    table.integer('media_id').notNullable();
    table.integer('disc_number').defaultTo(1); // For multi-disc sets
    table.text('formats').notNullable(); // JSON array of formats for this specific movie
    table.timestamps(true, true); // created_at and updated_at
    
    // Foreign key constraints
    table.foreign('physical_item_id').references('id').inTable('physical_items').onDelete('CASCADE');
    table.foreign('media_id').references('id').inTable('media').onDelete('CASCADE');
    
    // Indexes
    table.index(['physical_item_id']);
    table.index(['media_id']);
    table.index(['physical_item_id', 'disc_number']);
    
    // Unique constraint to prevent duplicate links
    table.unique(['physical_item_id', 'media_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('physical_item_media');
};
