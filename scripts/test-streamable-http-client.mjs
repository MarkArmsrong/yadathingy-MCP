import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// Update this to your own Vercel deployment URL
const origin = process.argv[2] || "https://your-project-name.vercel.app";

async function main() {
  const transport = new SSEClientTransport(new URL(`${origin}/mcp`));

  const client = new Client(
    {
      name: "example-client",
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

  await client.connect(transport);

  console.log("Connected", client.getServerCapabilities());

  const result = await client.listTools();
  const util = await import('util');
  console.log(util.inspect(result, { depth: null, colors: true }));
}

main();
