import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

export interface Config {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  tokenUrl: string;
}

export function getConfig(): Config {
  const clientId = process.env.ARDUINO_CLOUD_CLIENT_ID;
  const clientSecret = process.env.ARDUINO_CLOUD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing required environment variables. Please set ARDUINO_CLOUD_CLIENT_ID and ARDUINO_CLOUD_CLIENT_SECRET in your .env file.'
    );
  }

  return {
    clientId,
    clientSecret,
    apiBaseUrl: 'https://api2.arduino.cc/iot',
    tokenUrl: 'https://api2.arduino.cc/iot/v1/clients/token'
  };
}