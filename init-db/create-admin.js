import mongoose from "mongoose";
import { hashPassword } from "../server/auth.ts";
import { User } from "../shared/schema.ts";

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

async function main() {
  // Validate required environment variables
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("❌ Error: ADMIN_PASSWORD environment variable is required");
    console.error("Usage: ADMIN_PASSWORD=your_secure_password node create-admin.js");
    process.exit(1);
  }

  // Validate password strength
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    console.error("❌ Password validation failed:");
    passwordErrors.forEach(error => console.error(`   • ${error}`));
    console.error("\n💡 Example of a strong password: MySecure123!Pass");
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

main();
