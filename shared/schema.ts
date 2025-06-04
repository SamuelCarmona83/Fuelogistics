import { pgTable, text, serial, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  camion: text("camion").notNull(),
  conductor: text("conductor").notNull(),
  origen: text("origen").notNull(),
  destino: text("destino").notNull(),
  combustible: text("combustible").notNull(),
  cantidad_litros: integer("cantidad_litros").notNull(),
  fecha_salida: timestamp("fecha_salida", { withTimezone: true }).notNull(),
  estado: text("estado").notNull().default("En tránsito"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  cantidad_litros: z.number().min(1).max(30000, "Maximum fuel capacity is 30,000 liters"),
  fecha_salida: z.union([z.string(), z.date()]).refine((date) => {
    const departureDate = new Date(date);
    const now = new Date();
    return departureDate > now;
  }, "Departure date cannot be in the past"),
  estado: z.enum(["En tránsito", "Completado", "Cancelado"]),
});

export const updateTripSchema = insertTripSchema.partial().extend({
  id: z.string().uuid(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type UpdateTrip = z.infer<typeof updateTripSchema>;
export type Trip = typeof trips.$inferSelect;
