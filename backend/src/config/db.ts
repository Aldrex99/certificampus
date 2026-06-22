import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

export async function connectDatabase(uri: string = env.mongoUri): Promise<typeof mongoose> {
  const connection = await mongoose.connect(uri);
  // eslint-disable-next-line no-console
  console.log(`[db] Connected to MongoDB (${connection.connection.name})`);
  return connection;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
