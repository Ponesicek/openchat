import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { Client, createClient } from '@libsql/client';

import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: Client | undefined;
};

const conn = globalForDb.conn ?? createClient({ url: process.env.DB_FILE_NAME! });
if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });