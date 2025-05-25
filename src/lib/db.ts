// src/lib/db.ts
import { Pool } from 'pg';

let pool: Pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set.");
    }
    pool = new Pool({
      connectionString,
    });

    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1); // Or handle more gracefully
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const client = await getPool().connect();
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    // console.log('executed query', { text, duration, rows: res.rowCount }); // Optional logging
    return res;
  } finally {
    client.release();
  }
}

// Helper function to get a client for transactions
export async function getClient() {
  const client = await getPool().connect();
  return client;
}
