import mongoose from 'mongoose';
import { envConfig } from './env.config.js';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(envConfig.mongoUri);
    console.log(`[DB] Conectado a MongoDB (${envConfig.nodeEnv})`);
  } catch (error) {
    console.error('[DB ERROR] No se pudo conectar a MongoDB:', error.message);
    process.exit(1);
  }
};
