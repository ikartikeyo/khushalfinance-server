import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectDB() {
  try {
    if (!config.mongoUri) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    const conn = await mongoose.connect(config.mongoUri);
    console.log(`🌿 MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('👉 Please make sure your MONGODB_URI is set correctly in backend/.env');
    throw error;
  }
}

export default connectDB;
