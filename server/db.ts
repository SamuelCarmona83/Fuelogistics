import mongoose from 'mongoose';

export async function connectToMongoDB() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/fuel_truck_db';
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB ?? 'fuel_truck_db',
  });
  console.log('Connected to MongoDB');
}