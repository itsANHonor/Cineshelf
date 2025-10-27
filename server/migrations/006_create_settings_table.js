const { Knex } = require('knex');

exports.up = function(knex) {
  return knex.schema.createTable('settings', (table) => {
    table.increments('id').primary();
    table.string('key').notNullable().unique();
    table.text('value').nullable();
    table.text('description').nullable();
    table.timestamps(true, true); // created_at and updated_at
    
    // Indexes
    table.index('key');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('settings');
};
