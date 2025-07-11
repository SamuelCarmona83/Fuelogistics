import mongoose from "mongoose";
import { hashPassword } from "../server/auth.ts";
import { User } from "../shared/schema.ts";

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
