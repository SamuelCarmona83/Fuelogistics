import { User, Trip, Driver, Truck, Report } from '../shared/schema';
import { Types } from 'mongoose';

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

  // Session store placeholder
  sessionStore: undefined, // Replace with a MongoDB session store if needed
};
