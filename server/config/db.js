import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("❌ MONGODB_URI is missing from .env");
  }

  console.log("🔍 MongoDB URI detected");
  console.log(
    "🔗 Host:",
    uri.match(/@([^/]+)/)?.[1] || "Unable to detect host"
  );

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("✅ MongoDB Atlas Connected Successfully!");
    console.log(`📁 Host: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("❌ MongoDB Atlas Connection Failed!");
    console.error("Error:", error.message);
    throw error;
  }
}