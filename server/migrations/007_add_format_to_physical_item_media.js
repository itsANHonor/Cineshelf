/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('physical_item_media', (table) => {
      // Add formats column to store per-movie format information
      table.text('formats').nullable(); // JSON array: ["Blu-ray", "3D Blu-ray"]
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('physical_item_media', (table) => {
      table.dropColumn('formats');
    });
};
