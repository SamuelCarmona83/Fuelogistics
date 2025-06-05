// MongoDB initialization script (optional: create indexes, seed data, etc.)
// Example: create an admin user if not exists

const { MongoClient } = require('mongodb');

async function main() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fuel_truck_db';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || 'fuel_truck_db');
        const users = db.collection('users');
        const admin = await users.findOne({ username: 'admin' });
        if (!admin) {
            await users.insertOne({ username: 'admin', password: 'admin', role: 'admin' });
            console.log('Admin user created.');
        }
    } finally {
        await client.close();
    }
}

main().catch(console.error);
