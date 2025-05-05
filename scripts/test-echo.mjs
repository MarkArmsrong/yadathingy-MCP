import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// Update this to your own Vercel deployment URL
const origin = process.argv[2] || "https://yadathingy-mcp.vercel.app/";
const message = process.argv[3] || "Hello, World!";

async function main() {
  console.log(`Testing echo tool with message="${message}"`);
  
  // Changed back to using the /sse endpoint with increased timeout
  const transport = new SSEClientTransport(new URL(`${origin}/sse`));

  const client = new Client(
    {
      name: "echo-test-client",
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
    console.log("Calling echo tool...");
    const response = await client.callTool("echo", { message });
    console.log("Echo Tool Response:");
    console.log(response);
  } catch (error) {
    console.error("Error calling echo tool:", error);
  }

  client.close();
}

main();