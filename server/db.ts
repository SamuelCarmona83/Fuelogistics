import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import mongoose from 'mongoose';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

export async function connectToMongoDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fuel_truck_db';
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'fuel_truck_db',
  });
  console.log('Connected to MongoDB');
}