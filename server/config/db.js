import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/birthday_journey';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Notice: ${error.message}`);
    console.warn('⚠️ Server will continue in memory/fallback mode until MongoDB is connected.');
    return null;
  }
}
