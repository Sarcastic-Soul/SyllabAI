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

  console.log('Creating HNSW vector index on document_chunks...');
  await sql`CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx ON document_chunks USING hnsw (embedding vector_cosine_ops);`;
  console.log('HNSW vector index ensured.');
}

main().catch(console.error);
