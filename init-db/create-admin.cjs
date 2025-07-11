const mongoose = require("mongoose");
const { scrypt, randomBytes } = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(scrypt);

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
  await mongoose.connect("mongodb://localhost:27017/fuel_truck_db");
  const username = "admin";
  const password = "admin123"; // Cambia esto si lo deseas
  const role = "admin";

  const exists = await User.findOne({ username });
  if (exists) {
    console.log("Ya existe un usuario admin con ese nombre.");
    process.exit(0);
  }

  const hashed = await hashPassword(password);
  await User.create({ username, password: hashed, role });
  console.log("Usuario admin creado:", username);
  process.exit(0);
}

main();
