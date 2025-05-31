# Arduino Cloud MCP Server

A Model Context Protocol (MCP) server for Arduino Cloud integration. This server allows Large Language Models (LLMs) like Claude to interact with Arduino IoT Cloud devices, enabling natural language control of IoT devices.

## Features

- **list_devices**: List all Arduino Cloud devices
- **list_things**: List all Arduino Cloud things (devices with properties)
- **get_device**: Get details of a specific device
- **list_properties**: List all properties of a thing
- **get_property**: Get current value of a property
- **set_property**: Update a property value
- **control_light**: Smart light control with automatic device discovery

## Prerequisites

- Node.js 18 or higher
- Arduino Cloud account with API access
- Arduino Cloud API credentials (Client ID and Client Secret)

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g mcp-server-arduino-cloud
```

### Option 2: Install from Source

```bash
git clone https://github.com/maartenvanels/mcp-arduino-cloud.git
cd mcp-arduino-cloud
npm install
npm run build
```

## Getting Arduino Cloud API Credentials

1. Go to [Arduino Cloud](https://app.arduino.cc)
2. Navigate to "API Keys" in your account settings
3. Create a new API key with appropriate permissions
4. Copy the Client ID and Client Secret

## Claude Desktop Configuration

Add the server to your Claude Desktop configuration (`claude_desktop_config.json`):

### If installed from npm:

```json
{
  "mcpServers": {
    "arduino-cloud": {
      "command": "mcp-arduino-cloud",
      "env": {
        "ARDUINO_CLOUD_CLIENT_ID": "your-client-id-here",
        "ARDUINO_CLOUD_CLIENT_SECRET": "your-client-secret-here"
      }
    }
  }
}
```

### If installed from source:

**Windows:**
```json
{
  "mcpServers": {
    "arduino-cloud": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-arduino-cloud\\dist\\index.js"],
      "env": {
        "ARDUINO_CLOUD_CLIENT_ID": "your-client-id-here",
        "ARDUINO_CLOUD_CLIENT_SECRET": "your-client-secret-here"
      }
    }
  }
}
```

**macOS/Linux:**
```json
{
  "mcpServers": {
    "arduino-cloud": {
      "command": "node",
      "args": ["/path/to/mcp-arduino-cloud/dist/index.js"],
      "env": {
        "ARDUINO_CLOUD_CLIENT_ID": "your-client-id-here",
        "ARDUINO_CLOUD_CLIENT_SECRET": "your-client-secret-here"
      }
    }
  }
}
```

After updating the configuration, restart Claude Desktop.

## Example Commands

Once configured, you can use natural language commands in Claude:

- "Show me all my Arduino devices"
- "Turn on the office light"
- "Dim the kitchen lights to 50%"
- "What's the temperature from my sensor?"
- "Turn off all lights"

## Smart Light Control

The `control_light` tool provides intelligent light control:

```typescript
// Finds lights by partial name match
control_light({
  lightName: "office", // Matches any light with "office" in the name
  action: "on", // Actions: "on", "off", "dim"
  brightness: 75, // Optional: 0-100 for dimming
});
```

## API Structure

### Things vs Devices

Arduino Cloud uses two concepts:

- **Devices**: Physical Arduino boards
- **Things**: Logical groupings of properties (sensors, actuators)

For property control, you need to use Thing IDs, not Device IDs.

### Property Types

- `HOME_LIGHT`: Simple on/off lights (boolean)
- `HOME_DIMMED_LIGHT`: Dimmable lights with brightness control
  - `swi`: Switch state (boolean)
  - `bri`: Brightness level (0-100)
- `HOME_TEMPERATURE_C`: Temperature sensors
- `STATUS`: Generic status indicators

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Configuration

The server supports caching for improved performance:

- Thing and property data is cached for 5 minutes
- OAuth tokens are automatically refreshed before expiration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for the [Model Context Protocol](https://modelcontextprotocol.io/)
- Uses the [Arduino IoT Cloud API](https://www.arduino.cc/reference/en/iot/api/)

## Support

For issues and questions:

- Open an issue on GitHub
- Check the [Arduino Cloud documentation](https://docs.arduino.cc/arduino-cloud/)
- Visit the [MCP documentation](https://modelcontextprotocol.io/docs)