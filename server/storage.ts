import { User, Trip, Driver, Truck, Report } from '../shared/schema';
import { Types } from 'mongoose';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';

interface TripFilters {
  search?: string;
  status?: string;
  fuelType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const storage = {
  // User operations
  async getUserByUsername(username: string) {
    return User.findOne({ username });
  },
  async getUserById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return User.findById(id);
  },
  async createUser(userData: { username: string; password: string; role: string }) {
    return User.create(userData);
  },
  async getUsers() {
    return User.find({}, { password: 0 }); // No exponer hash de password
  },
  async updateUser(id: string, data: Partial<{ username: string; password: string; role: string }>) {
    if (!Types.ObjectId.isValid(id)) return null;
    // Si se actualiza password, debe ser hasheado fuera de aquí (en el endpoint)
    return User.findByIdAndUpdate(id, data, { new: true, fields: { password: 0 } });
  },
  async deleteUser(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return User.findByIdAndDelete(id);
  },

  // Trip operations
  async getTrips(filters: TripFilters = {}) {
    const query: any = {};
    if (filters.search) {
      query.$or = [
        { conductor: { $regex: filters.search, $options: 'i' } },
        { camion: { $regex: filters.search, $options: 'i' } },
        { origen: { $regex: filters.search, $options: 'i' } },
        { destino: { $regex: filters.search, $options: 'i' } },
      ];
    }
    if (filters.status) query.estado = filters.status;
    if (filters.fuelType) query.combustible = filters.fuelType;
    let sort: any = { fecha_salida: -1 };
    if (filters.sortBy) {
      sort = { [filters.sortBy]: filters.sortOrder === 'asc' ? 1 : -1 };
    }
    return Trip.find(query).sort(sort);
  },
  async getTripById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Trip.findById(id);
  },
  async createTrip(tripData: any) {
    return Trip.create(tripData);
  },
  async updateTrip(id: string, tripData: any) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Trip.findByIdAndUpdate(id, { ...tripData, updated_at: new Date() }, { new: true });
  },
  async deleteTrip(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Trip.findByIdAndUpdate(id, { estado: 'Cancelado', updated_at: new Date() }, { new: true });
  },

  // Driver operations
  async getDrivers() {
    return Driver.find();
  },
  async getDriverById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Driver.findById(id);
  },
  async createDriver(driverData: any) {
    return Driver.create(driverData);
  },
  async updateDriver(id: string, driverData: any) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Driver.findByIdAndUpdate(id, driverData, { new: true });
  },
  async deleteDriver(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Driver.findByIdAndDelete(id);
  },

  // Truck operations
  async getTrucks() {
    return Truck.find();
  },
  async getTruckById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Truck.findById(id);
  },
  async createTruck(truckData: any) {
    return Truck.create(truckData);
  },
  async updateTruck(id: string, truckData: any) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Truck.findByIdAndUpdate(id, truckData, { new: true });
  },
  async deleteTruck(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Truck.findByIdAndDelete(id);
  },

  // Report operations
  async getReports() {
    return Report.find().populate('trip');
  },
  async createReport(reportData: any) {
    return Report.create(reportData);
  },

  // --- CONFIGURACIÓN DEL SISTEMA Y PREFERENCIAS DE USUARIO ---
  async getSystemConfig() {
    // Solo debe haber un documento de configuración global
    const config = await (await import("../shared/schema")).SystemConfig.findOne();
    return config;
  },
  async saveSystemConfig(data: any) {
    const { SystemConfig } = await import("../shared/schema");
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig(data);
    } else {
      Object.assign(config, data);
    }
    await config.save();
    return config;
  },
  async getUserPreferences(userId: string) {
    const { UserPreferences } = await import("../shared/schema");
    return UserPreferences.findOne({ userId });
  },
  async saveUserPreferences(userId: string, data: any) {
    const { UserPreferences } = await import("../shared/schema");
    let prefs = await UserPreferences.findOne({ userId });
    if (!prefs) {
      prefs = new UserPreferences({ ...data, userId });
    } else {
      Object.assign(prefs, data);
    }
    await prefs.save();
    return prefs;
  },
  async getSecuritySettings() {
    const { SecuritySettings } = await import("../shared/schema");
    return SecuritySettings.findOne();
  },
  async saveSecuritySettings(data: any) {
    const { SecuritySettings } = await import("../shared/schema");
    let config = await SecuritySettings.findOne();
    if (!config) {
      config = new SecuritySettings(data);
    } else {
      Object.assign(config, data);
    }
    await config.save();
    return config;
  },

  // Session store for MongoDB
  sessionStore: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/fuel_truck_db',
    dbName: process.env.MONGODB_DB || 'fuel_truck_db',
    collectionName: 'sessions',
  }),
};
