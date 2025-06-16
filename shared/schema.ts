import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

export interface IUser extends Document {
  username: string;
  password: string;
  role: string;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

export const User = mongoose.model<IUser>('User', UserSchema);

// Trip model
export interface ITrip extends Document {
  conductor: string;
  camion: string;
  combustible: string;
  origen: string;
  destino: string;
  estado: string;
  cantidad_litros: number;
  fecha_salida: Date;
  created_at: Date;
  updated_at: Date;
}

const TripSchema = new Schema<ITrip>({
  conductor: { type: String, required: true },
  camion: { type: String, required: true },
  combustible: { type: String, required: true },
  origen: { type: String, required: true },
  destino: { type: String, required: true },
  estado: { type: String, required: true },
  cantidad_litros: { type: Number, required: true },
  fecha_salida: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const Trip = mongoose.model<ITrip>('Trip', TripSchema);

// Driver model
export interface IDriver extends Document {
  name: string;
  license: string;
  phone: string;
}

const DriverSchema = new Schema<IDriver>({
  name: { type: String, required: true },
  license: { type: String, required: true },
  phone: { type: String, required: true },
});

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);

// Truck model
export interface ITruck extends Document {
  plate: string;
  truckModel: string;
  capacity: number;
}

const TruckSchema = new Schema<ITruck>({
  plate: { type: String, required: true, unique: true },
  truckModel: { type: String, required: true },
  capacity: { type: Number, required: true },
});

export const Truck = mongoose.model<ITruck>('Truck', TruckSchema);

// Report model
export interface IReport extends Document {
  trip: mongoose.Types.ObjectId;
  details: string;
  created_at: Date;
}

const ReportSchema = new Schema<IReport>({
  trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  details: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export const Report = mongoose.model<IReport>('Report', ReportSchema);

// If you need Zod validation schemas for Trip, add them here:
export const insertTripSchema = z.object({
  conductor: z.string(),
  camion: z.string(),
  combustible: z.string(),
  origen: z.string(),
  destino: z.string(),
  estado: z.string(),
  cantidad_litros: z.number().min(1, "Cantidad requerida").max(30000, "Máximo 30,000 litros"),
  fecha_salida: z.coerce.date(),
});

export const updateTripSchema = insertTripSchema.partial();

// Type for frontend (without Document methods)
export type Trip = {
  id?: string;
  _id?: string;
  conductor: string;
  camion: string;
  combustible: string;
  origen: string;
  destino: string;
  estado: string;
  cantidad_litros: number;
  fecha_salida: Date | string;
  created_at?: Date;
  updated_at?: Date;
};

// Zod validation schemas for User
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  role: z.string(),
});
export const updateUserSchema = insertUserSchema.partial();

// Zod validation schemas for Driver
export const insertDriverSchema = z.object({
  name: z.string(),
  license: z.string(),
  phone: z.string(),
});
export const updateDriverSchema = insertDriverSchema.partial();

// Zod validation schemas for Truck
export const insertTruckSchema = z.object({
  plate: z.string(),
  truckModel: z.string(),
  capacity: z.number(),
});
export const updateTruckSchema = insertTruckSchema.partial();

// Zod validation schemas for Report
export const insertReportSchema = z.object({
  trip: z.string(), // Should be a valid ObjectId string
  details: z.string(),
  created_at: z.coerce.date().optional(),
});
export const updateReportSchema = insertReportSchema.partial();

// Zod validation schema for user login
export const loginUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// --- CONFIGURACIÓN DEL SISTEMA Y PREFERENCIAS DE USUARIO ---

export interface ISystemConfig extends Document {
  maxFuelCapacity: number;
  autoRefreshInterval: number;
  maxConcurrentTrips: number;
  defaultFuelType: string;
  timezone: string;
  language: string;
  enableNotifications: boolean;
  enableRealTimeUpdates: boolean;
  enableEmailAlerts: boolean;
  maintenanceMode: boolean;
}

const SystemConfigSchema = new Schema<ISystemConfig>({
  maxFuelCapacity: { type: Number, required: true },
  autoRefreshInterval: { type: Number, required: true },
  maxConcurrentTrips: { type: Number, required: true },
  defaultFuelType: { type: String, required: true },
  timezone: { type: String, required: true },
  language: { type: String, required: true },
  enableNotifications: { type: Boolean, required: true },
  enableRealTimeUpdates: { type: Boolean, required: true },
  enableEmailAlerts: { type: Boolean, required: true },
  maintenanceMode: { type: Boolean, required: true },
});

export const SystemConfig = mongoose.model<ISystemConfig>("SystemConfig", SystemConfigSchema);

export const systemConfigSchema = z.object({
  maxFuelCapacity: z.number(),
  autoRefreshInterval: z.number(),
  maxConcurrentTrips: z.number(),
  defaultFuelType: z.string(),
  timezone: z.string(),
  language: z.string(),
  enableNotifications: z.boolean(),
  enableRealTimeUpdates: z.boolean(),
  enableEmailAlerts: z.boolean(),
  maintenanceMode: z.boolean(),
});

export type SystemConfigType = z.infer<typeof systemConfigSchema>;

export interface IUserPreferences extends Document {
  userId: string; // referencia al usuario
  theme: string;
  dashboardRefresh: boolean;
  soundAlerts: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  defaultView: string;
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
  userId: { type: String, required: true, unique: true },
  theme: { type: String, required: true },
  dashboardRefresh: { type: Boolean, required: true },
  soundAlerts: { type: Boolean, required: true },
  emailNotifications: { type: Boolean, required: true },
  smsNotifications: { type: Boolean, required: true },
  defaultView: { type: String, required: true },
});

export const UserPreferences = mongoose.model<IUserPreferences>("UserPreferences", UserPreferencesSchema);

export const userPreferencesSchema = z.object({
  userId: z.string(),
  theme: z.string(),
  dashboardRefresh: z.boolean(),
  soundAlerts: z.boolean(),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  defaultView: z.string(),
});

export type UserPreferencesType = z.infer<typeof userPreferencesSchema>;

export interface ISecuritySettings extends Document {
  sessionTimeout: number;
  passwordExpiry: number;
  maxLoginAttempts: number;
  twoFactorAuth: boolean;
  auditLogging: boolean;
}

const SecuritySettingsSchema = new Schema<ISecuritySettings>({
  sessionTimeout: { type: Number, required: true },
  passwordExpiry: { type: Number, required: true },
  maxLoginAttempts: { type: Number, required: true },
  twoFactorAuth: { type: Boolean, required: true },
  auditLogging: { type: Boolean, required: true },
});

export const SecuritySettings = mongoose.model<ISecuritySettings>("SecuritySettings", SecuritySettingsSchema);

export const securitySettingsSchema = z.object({
  sessionTimeout: z.number(),
  passwordExpiry: z.number(),
  maxLoginAttempts: z.number(),
  twoFactorAuth: z.boolean(),
  auditLogging: z.boolean(),
});

export type SecuritySettingsType = z.infer<typeof securitySettingsSchema>;
