// MongoDB initialization script
// This script sets up indexes and database configuration
// For admin user creation, use the secure create-admin.cjs script instead

const { MongoClient } = require('mongodb');

async function main() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fuel_truck_db';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(process.env.MONGODB_DB || 'fuel_truck_db');

        // Create indexes for better performance
        console.log('🔄 Creating database indexes...');

        // Users collection indexes
        const users = db.collection('users');
        await users.createIndex({ username: 1 }, { unique: true });
        await users.createIndex({ role: 1 });

        // Trips collection indexes (if exists)
        const trips = db.collection('trips');
        await trips.createIndex({ createdAt: -1 });
        await trips.createIndex({ status: 1 });
        await trips.createIndex({ driverId: 1 });

        // Drivers collection indexes (if exists)
        const drivers = db.collection('drivers');
        await drivers.createIndex({ email: 1 }, { unique: true, sparse: true });
        await drivers.createIndex({ licenseNumber: 1 }, { unique: true, sparse: true });

        console.log('✅ Database indexes created successfully');
        console.log('');
        console.log('⚠️  To create an admin user, run:');
        console.log('   ADMIN_PASSWORD="YourSecurePassword123!" node create-admin.cjs');
        console.log('   or use: ./scripts/create-admin-secure.sh');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    } finally {
        await client.close();
    }
}

main().catch(console.error);
