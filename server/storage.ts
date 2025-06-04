import { users, trips, type User, type InsertUser, type Trip, type InsertTrip, type UpdateTrip } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, ilike, or, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trip operations
  getTrips(filters?: {
    search?: string;
    status?: string;
    fuelType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Trip[]>;
  getTripById(id: string): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, trip: Partial<UpdateTrip>): Promise<Trip | undefined>;
  deleteTrip(id: string): Promise<void>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getTrips(filters?: {
    search?: string;
    status?: string;
    fuelType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Trip[]> {
    let query = db.select().from(trips);

    // Apply filters
    const conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(trips.conductor, `%${filters.search}%`),
          ilike(trips.camion, `%${filters.search}%`),
          ilike(trips.origen, `%${filters.search}%`),
          ilike(trips.destino, `%${filters.search}%`)
        )
      );
    }

    if (filters?.status) {
      conditions.push(eq(trips.estado, filters.status));
    }

    if (filters?.fuelType) {
      conditions.push(eq(trips.combustible, filters.fuelType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortField = filters?.sortBy || 'fecha_salida';
    const sortOrder = filters?.sortOrder || 'desc';
    
    switch (sortField) {
      case 'conductor':
        query = query.orderBy(sortOrder === 'asc' ? asc(trips.conductor) : desc(trips.conductor));
        break;
      case 'camion':
        query = query.orderBy(sortOrder === 'asc' ? asc(trips.camion) : desc(trips.camion));
        break;
      case 'combustible':
        query = query.orderBy(sortOrder === 'asc' ? asc(trips.combustible) : desc(trips.combustible));
        break;
      case 'estado':
        query = query.orderBy(sortOrder === 'asc' ? asc(trips.estado) : desc(trips.estado));
        break;
      default:
        query = query.orderBy(sortOrder === 'asc' ? asc(trips.fecha_salida) : desc(trips.fecha_salida));
    }

    return await query;
  }

  async getTripById(id: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip || undefined;
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db
      .insert(trips)
      .values({
        ...trip,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return newTrip;
  }

  async updateTrip(id: string, tripData: Partial<UpdateTrip>): Promise<Trip | undefined> {
    const [updatedTrip] = await db
      .update(trips)
      .set({
        ...tripData,
        updated_at: new Date(),
      })
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip || undefined;
  }

  async deleteTrip(id: string): Promise<void> {
    // Logical deletion - set status to "Cancelado"
    await db
      .update(trips)
      .set({
        estado: "Cancelado",
        updated_at: new Date(),
      })
      .where(eq(trips.id, id));
  }
}

export const storage = new DatabaseStorage();
