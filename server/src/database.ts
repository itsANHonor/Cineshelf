import knex from 'knex';
import path from 'path';

const databasePath = process.env.DATABASE_PATH || './database.sqlite';

export const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.resolve(databasePath)
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, '../migrations'),
    extension: 'js'
  }
});

export async function setupDatabase() {
  try {
    // Run any pending migrations
    await db.migrate.latest();
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}
