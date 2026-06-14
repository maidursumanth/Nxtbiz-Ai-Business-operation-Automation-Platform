import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    console.warn('NxtBiz API starting without MONGODB_URI. Database routes will fail until MongoDB is configured.');
    return null;
  }

  mongoose.set('strictQuery', true);
  const fallbackLocalUri = 'mongodb://127.0.0.1:27017/nxtbiz';

  try {
    if (env.MONGODB_URI.startsWith('mongodb+srv://') && env.DNS_SERVERS) {
      dns.setServers(env.DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean));
    }

    await mongoose.connect(env.MONGODB_URI);
    const isAtlas = env.MONGODB_URI.startsWith('mongodb+srv://');
    console.log(`NxtBiz API connected to MongoDB${isAtlas ? ' Atlas' : ''}`);
    return mongoose.connection;
  } catch (error) {
    if (env.NODE_ENV === 'production') {
      throw error;
    }

    console.warn(`NxtBiz API could not connect to MongoDB: ${error.message}`);
    if (env.MONGODB_URI.startsWith('mongodb+srv://')) {
      console.warn('Atlas SRV connection failed. In development, attempting local fallback to mongodb://127.0.0.1:27017/nxtbiz.');
      try {
        await mongoose.connect(fallbackLocalUri);
        console.log('NxtBiz API connected to local MongoDB fallback');
        return mongoose.connection;
      } catch (fallbackError) {
        console.warn(`Local MongoDB fallback also failed: ${fallbackError.message}`);
      }
    }

    console.warn('Database-backed routes will fail until MongoDB is reachable. You can either whitelist this IP for Atlas or run a local MongoDB instance.');
    return null;
  }
}
