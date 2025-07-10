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
  attachments?: Array<{
    fileName: string;
    originalName: string;
    url: string;
    uploadedAt: Date;
  }>;
  created_at: Date;
  updated_at: Date;
}

const AttachmentSchema = new Schema({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const TripSchema = new Schema<ITrip>({
  conductor: { type: String, required: true },
  camion: { type: String, required: true },
  combustible: { type: String, required: true },
  origen: { type: String, required: true },
  destino: { type: String, required: true },
  estado: { type: String, required: true },
  cantidad_litros: { type: Number, required: true },
  fecha_salida: { type: Date, required: true },
  attachments: [AttachmentSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const Trip = mongoose.model<ITrip>('Trip', TripSchema);

// Driver model
export interface IDriver extends Document {
  name: string;
  license: string;
  phone: string;
  photo?: {
    fileName: string;
    originalName: string;
    url: string;
    uploadedAt: Date;
  };
  documents?: Array<{
    fileName: string;
    originalName: string;
    url: string;
    uploadedAt: Date;
  }>;
}

const DriverSchema = new Schema<IDriver>({
  name: { type: String, required: true },
  license: { type: String, required: true },
  phone: { type: String, required: true },
  photo: AttachmentSchema,
  documents: [AttachmentSchema],
});

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);

// Truck model
export interface ITruck extends Document {
  plate: string;
  truckModel: string;
  capacity: number;
  photo?: {
    fileName: string;
    originalName: string;
    url: string;
    uploadedAt: Date;
  };
  documents?: Array<{
    fileName: string;
    originalName: string;
    url: string;
    uploadedAt: Date;
  }>;
}

const TruckSchema = new Schema<ITruck>({
  plate: { type: String, required: true, unique: true },
  truckModel: { type: String, required: true },
  capacity: { type: Number, required: true },
  photo: AttachmentSchema,
  documents: [AttachmentSchema],
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
  attachments?: Array<{
    fileName: string;
    originalName: string;
    url: string;
    uploadedAt: Date;
  }>;
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
