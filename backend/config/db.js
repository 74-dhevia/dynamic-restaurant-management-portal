import mongoose from 'mongoose';
import { execSync } from 'child_process';

/**
 * Resolves MongoDB Atlas SRV hostnames to individual shard replica set addresses
 * if the local network's DNS resolver blocks Node.js c-ares SRV queries (ECONNREFUSED).
 */
const resolveSrvFallback = (uri) => {
  try {
    const match = uri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)(.*)$/);
    if (!match) return null;
    const [, auth, host, rest] = match;
    const cmd = `powershell -NoProfile -Command "(Resolve-DnsName -Name _mongodb._tcp.${host} -Type SRV).NameTarget"`;
    const output = execSync(cmd, { timeout: 4000 }).toString();
    const targets = output
      .split(/\r?\n/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (targets.length === 0) return null;
    const hosts = targets.map((t) => (t.includes(':') ? t : `${t}:27017`)).join(',');
    const separator = rest.includes('?') ? '&' : '?';
    return `mongodb://${auth}@${hosts}${rest}${separator}ssl=true&authSource=admin`;
  } catch {
    return null;
  }
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri === 'YOUR_MONGODB_CONNECTION_STRING' || uri.trim() === '') {
    console.error('MongoDB Connection Failed');
    console.error('Error: MONGO_URI is unconfigured in .env');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'zestro',
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB Connected Successfully');
    return conn;
  } catch (error) {
    // If SRV lookup failed due to network DNS restrictions, attempt fallback resolution
    if (uri.startsWith('mongodb+srv://') && (error.code === 'ECONNREFUSED' || error.message.includes('querySrv'))) {
      const fallbackUri = resolveSrvFallback(uri);
      if (fallbackUri) {
        try {
          const conn = await mongoose.connect(fallbackUri, {
            dbName: 'zestro',
            serverSelectionTimeoutMS: 5000,
          });
          console.log('MongoDB Connected Successfully');
          return conn;
        } catch (fallbackError) {
          console.error('MongoDB Connection Failed');
          console.error(`Error: ${fallbackError.message}`);
          return null;
        }
      }
    }

    console.error('MongoDB Connection Failed');
    console.error(`Error: ${error.message}`);
    return null;
  }
};

export default connectDB;
