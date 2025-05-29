import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { ArduinoCloudClient } from './arduino-cloud-client.js';
import { getConfig } from './config.js';

const server = new Server(
  {
    name: 'mcp-arduino-cloud',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let arduinoClient: ArduinoCloudClient;

try {
  const config = getConfig();
  arduinoClient = new ArduinoCloudClient(config);
} catch (error) {
  console.error('Failed to initialize Arduino Cloud client:', error);
  process.exit(1);
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_devices',
      description: 'List all Arduino Cloud devices',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'list_things',
      description: 'List all Arduino Cloud things (devices with properties)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'control_light',
      description: 'Easy control for lights - automatically finds and controls lights by name',
      inputSchema: {
        type: 'object',
        properties: {
          lightName: {
            type: 'string',
            description: 'Part of the light name (e.g. "office", "kitchen", "bedroom")',
          },
          action: {
            type: 'string',
            enum: ['on', 'off', 'dim'],
            description: 'What to do with the light',
          },
          brightness: {
            type: 'number',
            description: 'Brightness level 0-100 (only for dim action)',
            minimum: 0,
            maximum: 100,
          },
        },
        required: ['lightName', 'action'],
      },
    },
    {
      name: 'get_device',
      description: 'Get details of a specific device',
      inputSchema: {
        type: 'object',
        properties: {
          deviceId: {
            type: 'string',
            description: 'The ID of the device',
          },
        },
        required: ['deviceId'],
      },
    },
    {
      name: 'list_properties',
      description: 'List all properties of a thing',
      inputSchema: {
        type: 'object',
        properties: {
          thingId: {
            type: 'string',
            description: 'The ID of the thing',
          },
        },
        required: ['thingId'],
      },
    },
    {
      name: 'get_property',
      description: 'Get the current value of a thing property',
      inputSchema: {
        type: 'object',
        properties: {
          thingId: {
            type: 'string',
            description: 'The ID of the thing',
          },
          propertyId: {
            type: 'string',
            description: 'The ID of the property',
          },
        },
        required: ['thingId', 'propertyId'],
      },
    },
    {
      name: 'set_property',
      description: 'Set the value of a thing property',
      inputSchema: {
        type: 'object',
        properties: {
          thingId: {
            type: 'string',
            description: 'The ID of the thing',
          },
          propertyId: {
            type: 'string',
            description: 'The ID of the property',
          },
          value: {
            description: 'The value to set',
          },
        },
        required: ['thingId', 'propertyId', 'value'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_devices': {
        const devices = await arduinoClient.getDevices();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(devices, null, 2),
            },
          ],
        };
      }

      case 'get_device': {
        const { deviceId } = args as { deviceId: string };
        const device = await arduinoClient.getDevice(deviceId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(device, null, 2),
            },
          ],
        };
      }

      case 'list_things': {
        const things = await arduinoClient.getThings();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(things, null, 2),
            },
          ],
        };
      }

      case 'list_properties': {
        const { thingId } = args as { thingId: string };
        const properties = await arduinoClient.getProperties(thingId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(properties, null, 2),
            },
          ],
        };
      }

      case 'get_property': {
        const { thingId, propertyId } = args as { thingId: string; propertyId: string };
        const property = await arduinoClient.getProperty(thingId, propertyId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(property, null, 2),
            },
          ],
        };
      }

      case 'set_property': {
        const { thingId, propertyId, value } = args as {
          thingId: string;
          propertyId: string;
          value: any;
        };
        
        // Parse JSON string if needed
        let parsedValue = value;
        if (typeof value === 'string') {
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            // If not JSON, use as-is
          }
        }
        
        await arduinoClient.updateProperty(thingId, propertyId, parsedValue);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully updated property ${propertyId} on thing ${thingId}`,
            },
          ],
        };
      }

      case 'control_light': {
        const { lightName, action, brightness } = args as {
          lightName: string;
          action: 'on' | 'off' | 'dim';
          brightness?: number;
        };

        // Get all things to find lights
        const things = await arduinoClient.getThings();
        const lightsFound: Array<{thing: any, property: any}> = [];

        // Search for lights matching the name
        for (const thing of things) {
          const properties = await arduinoClient.getProperties(thing.id);
          for (const prop of properties) {
            if (prop.type.includes('LIGHT') && 
                prop.name.toLowerCase().includes(lightName.toLowerCase())) {
              lightsFound.push({ thing, property: prop });
            }
          }
        }

        if (lightsFound.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No lights found matching "${lightName}"`,
            }],
          };
        }

        // Control all matching lights
        const results = [];
        for (const { thing, property } of lightsFound) {
          let value: any;
          
          if (property.type === 'HOME_DIMMED_LIGHT') {
            switch (action) {
              case 'on':
                value = { swi: true, bri: brightness || 100 };
                break;
              case 'off':
                value = { swi: false };
                break;
              case 'dim':
                value = { swi: true, bri: brightness || 50 };
                break;
            }
          } else if (property.type === 'HOME_LIGHT') {
            value = action !== 'off';
          }

          await arduinoClient.updateProperty(thing.id, property.id, value);
          results.push(`${property.name} (${thing.name}): ${action}${brightness ? ` at ${brightness}%` : ''}`);
        }

        return {
          content: [{
            type: 'text',
            text: `Controlled ${results.length} light(s):\n${results.join('\n')}`,
          }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Arduino Cloud MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});