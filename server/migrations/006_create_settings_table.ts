import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('settings', (table) => {
    table.increments('id').primary();
    table.string('key').notNullable().unique();
    table.text('value').nullable();
    table.text('description').nullable();
    table.timestamps(true, true); // created_at and updated_at
    
    // Indexes
    table.index('key');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('settings');
}
