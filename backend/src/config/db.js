
import mongoose from "mongoose";

let connectionPromise;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("Environment variable MONGO_URI belum tersedia");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  await connectionPromise;

  return mongoose.connection;
};
