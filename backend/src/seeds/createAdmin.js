import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin sudah ada:", email);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || "Administrator",
      email,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
    });
    console.log("Admin berhasil dibuat:", email);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
