import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// Update this to your own Vercel deployment URL
const origin = process.argv[2] || "https://your-project-name.vercel.app";
const location = process.argv[3] || "Seattle, USA";
const days = parseInt(process.argv[4] || "3");

async function main() {
  console.log(`Testing getWeather tool with location=${location}, days=${days}`);
  
  const transport = new SSEClientTransport(new URL(`${origin}/sse`));

  const client = new Client(
    {
      name: "weather-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
      },
    }
  );

  console.log("Connecting to", origin);
  await client.connect(transport);
  console.log("Connected to MCP server");

  try {
    console.log("Calling getWeather tool...");
    const response = await client.callTool("getWeather", { location, days });
    console.log("Weather Tool Response:");
    console.log(response);
  } catch (error) {
    console.error("Error calling getWeather tool:", error);
  }

  client.close();
}

main();