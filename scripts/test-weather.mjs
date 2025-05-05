import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// Update this to your own Vercel deployment URL
const origin = process.argv[2] || "https://yadathingy-mcp.vercel.app/";
const location = process.argv[3] || "Seattle, USA";
const days = parseInt(process.argv[4] || "3");

async function main() {
  console.log(`Testing getWeather tool with location=${location}, days=${days}`);
  
  console.log(`Creating SSE transport to ${origin}/sse`);
  const transport = new SSEClientTransport(new URL(`${origin}/sse`), {
    // Add custom timeout setting for SSE client
    timeout: 120000 // 2 minutes in milliseconds
  });

  console.log("Creating MCP client");
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
  try {
    await client.connect(transport);
    console.log("Connected to MCP server");

    console.log("Calling getWeather tool...");
    const response = await client.callTool("getWeather", { location, days });
    console.log("Weather Tool Response:");
    console.log(response);
  } catch (error) {
    console.error("Error details:", error);
    if (error.code) console.error(`Error code: ${error.code}`);
    if (error.data) console.error(`Error data:`, error.data);
    if (error.stack) console.error(`Stack trace: ${error.stack}`);
  } finally {
    console.log("Closing client connection");
    client.close();
  }
}

main();