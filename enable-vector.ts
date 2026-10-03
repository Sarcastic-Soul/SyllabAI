// One-time setup for a NEW database: turns on the pgvector extension, which has
// to exist before the migrations create the vector(768) column.
// Run with: node enable-vector.ts   (Node 22.18+ runs TypeScript files directly)
// Tables and indexes (including the HNSW and full-text indexes) come from the
// Drizzle migrations in lib/db/migrations, not from this script.
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log('Creating vector extension...');
  await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
  console.log('Vector extension enabled.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
