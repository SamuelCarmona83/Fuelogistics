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

export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  cedula: text("cedula").notNull().unique(),
  telefono: text("telefono").notNull(),
  email: text("email"),
  licencia: text("licencia").notNull(),
  fecha_vencimiento_licencia: timestamp("fecha_vencimiento_licencia", { withTimezone: true }).notNull(),
  estado: text("estado").notNull().default("activo"),
  experiencia_anos: integer("experiencia_anos").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const trucks = pgTable("trucks", {
  id: uuid("id").primaryKey().defaultRandom(),
  placa: text("placa").notNull().unique(),
  marca: text("marca").notNull(),
  modelo: text("modelo").notNull(),
  ano: integer("ano").notNull(),
  capacidad_litros: integer("capacidad_litros").notNull(),
  estado: text("estado").notNull().default("disponible"),
  ultimo_mantenimiento: timestamp("ultimo_mantenimiento", { withTimezone: true }),
  proximo_mantenimiento: timestamp("proximo_mantenimiento", { withTimezone: true }),
  combustible_actual: integer("combustible_actual").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  titulo: text("titulo").notNull(),
  tipo: text("tipo").notNull(),
  fecha_inicio: timestamp("fecha_inicio", { withTimezone: true }).notNull(),
  fecha_fin: timestamp("fecha_fin", { withTimezone: true }).notNull(),
  datos: text("datos").notNull(),
  generado_por: integer("generado_por").notNull().references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
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

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  cedula: z.string().min(7, "Cédula debe tener al menos 7 dígitos"),
  telefono: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
  email: z.string().email().optional(),
  experiencia_anos: z.number().min(0).max(50, "Experiencia no puede exceder 50 años"),
  estado: z.enum(["activo", "inactivo", "suspendido"]),
});

export const insertTruckSchema = createInsertSchema(trucks).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  ano: z.number().min(1990).max(new Date().getFullYear()),
  capacidad_litros: z.number().min(1000).max(50000, "Capacidad máxima de 50,000 litros"),
  estado: z.enum(["disponible", "en_ruta", "mantenimiento", "fuera_servicio"]),
  combustible_actual: z.number().min(0).optional(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  created_at: true,
}).extend({
  tipo: z.enum(["diario", "semanal", "mensual", "personalizado"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type UpdateTrip = z.infer<typeof updateTripSchema>;
export type Trip = typeof trips.$inferSelect;

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type Truck = typeof trucks.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
