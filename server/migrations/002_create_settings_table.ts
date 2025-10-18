import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
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
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('settings');
}
