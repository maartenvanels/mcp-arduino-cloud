import axios, { AxiosInstance } from 'axios';
import { Config } from './config.js';

export interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Thing {
  id: string;
  name: string;
  device_id: string;
  properties: Property[];
}

export interface Property {
  id: string;
  name: string;
  permission: string;
  type: string;
  update_strategy: string;
  last_value: any;
  updated_at: string;
}

export class ArduinoCloudClient {
  private thingCache: Map<string, Thing> = new Map();
  private propertyCache: Map<string, Property[]> = new Map();
  private cacheExpiry: number = 0;
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private config: Config) {
    this.api = axios.create({
      baseURL: this.config.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        this.config.tokenUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          audience: 'https://api2.arduino.cc/iot',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
      return this.accessToken!;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error}`);
    }
  }

  async getDevices(): Promise<Device[]> {
    try {
      const response = await this.api.get('/v2/devices');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get devices: ${error}`);
    }
  }

  async getDevice(deviceId: string): Promise<Device> {
    try {
      const response = await this.api.get(`/v2/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get device: ${error}`);
    }
  }

  async getThings(): Promise<Thing[]> {
    // Check cache
    if (this.cacheExpiry > Date.now() && this.thingCache.size > 0) {
      return Array.from(this.thingCache.values());
    }

    try {
      const response = await this.api.get('/v2/things');
      const things = response.data;
      
      // Clear and rebuild cache
      this.thingCache.clear();
      this.propertyCache.clear();
      
      for (const thing of things) {
        this.thingCache.set(thing.device_id, thing);
      }
      
      // Cache for 5 minutes
      this.cacheExpiry = Date.now() + 5 * 60 * 1000;
      
      return things;
    } catch (error) {
      throw new Error(`Failed to get things: ${error}`);
    }
  }

  async getThingByDeviceId(deviceId: string): Promise<Thing | undefined> {
    // First check cache
    if (this.thingCache.has(deviceId)) {
      return this.thingCache.get(deviceId);
    }
    
    // If not in cache, refresh things list
    await this.getThings();
    return this.thingCache.get(deviceId);
  }

  async getProperties(thingId: string): Promise<Property[]> {
    try {
      const response = await this.api.get(`/v2/things/${thingId}/properties`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get properties: ${error}`);
    }
  }

  async getProperty(thingId: string, propertyId: string): Promise<Property> {
    try {
      const response = await this.api.get(`/v2/things/${thingId}/properties/${propertyId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get property: ${error}`);
    }
  }

  async updateProperty(thingId: string, propertyId: string, value: any): Promise<void> {
    try {
      // Arduino Cloud v2 API uses PUT with value in body
      await this.api.put(`/v2/things/${thingId}/properties/${propertyId}/publish`, {
        value: value,
      });
    } catch (error) {
      throw new Error(`Failed to update property: ${error}`);
    }
  }
}