const mongoose = require("mongoose");
const { scrypt, randomBytes } = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(scrypt);

// Password validation function
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return errors;
}

// Definir el esquema User localmente para evitar dependencias TS/ESM
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  // Validate required environment variables
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("❌ Error: ADMIN_PASSWORD environment variable is required");
    console.error("Usage: ADMIN_PASSWORD=your_secure_password node create-admin.cjs");
    process.exit(1);
  }

  // Validate password strength
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    console.error("❌ Error: Password does not meet the following requirements:");
    passwordErrors.forEach(err => console.error(` - ${err}`));
    process.exit(1);
  }

  try {
    await mongoose.connect("mongodb://localhost:27017/fuel_truck_db");
    console.log("✅ Connected to MongoDB");

    const username = process.env.ADMIN_USERNAME || "admin";
    const role = "admin";

    const exists = await User.findOne({ username });
    if (exists) {
      console.log(`ℹ️  Admin user '${username}' already exists. Skipping creation.`);
      process.exit(0);
    }

    const hashed = await hashPassword(password);
    await User.create({ username, password: hashed, role });
    console.log(`✅ Admin user '${username}' created successfully`);
    console.log("⚠️  Please store the password securely and remove it from environment variables");

  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
