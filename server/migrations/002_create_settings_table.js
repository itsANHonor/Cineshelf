/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('settings', (table) => {
    table.increments('id').primary();
    table.string('key').notNullable().unique();
    table.text('value').nullable();
    table.timestamps(true, true);
  }).then(() => {
    // Insert default settings
    return knex('settings').insert([
      { key: 'collection_public', value: 'false' },
      { key: 'site_title', value: 'My Media Collection' },
      { key: 'items_per_page', value: '20' }
    ]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('settings');
};

