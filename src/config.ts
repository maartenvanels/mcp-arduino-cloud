import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Only load .env file if it exists (for development)
try {
  dotenv.config({ path: join(__dirname, '..', '.env') });
} catch (e) {
  // .env file is optional
}

export interface Config {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  tokenUrl: string;
}

export function getConfig(): Config {
  // First check environment variables (can be set via Claude config)
  const clientId = process.env.ARDUINO_CLOUD_CLIENT_ID;
  const clientSecret = process.env.ARDUINO_CLOUD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing required credentials. Please set ARDUINO_CLOUD_CLIENT_ID and ARDUINO_CLOUD_CLIENT_SECRET as environment variables.'
    );
  }

  return {
    clientId,
    clientSecret,
    apiBaseUrl: 'https://api2.arduino.cc/iot',
    tokenUrl: 'https://api2.arduino.cc/iot/v1/clients/token'
  };
}