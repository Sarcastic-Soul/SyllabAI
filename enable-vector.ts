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

main().catch(console.error);
