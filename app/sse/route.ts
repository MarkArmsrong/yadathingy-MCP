import { createServerResponseAdapter } from "@/lib/server-response-adapter";
import { mcpHandler } from "../mcp";

// Increased from 60 to 300 seconds to give more time for tool execution
export const maxDuration = 300;

export async function GET(req: Request) {
  console.log("SSE route handler called, attempting to create connection");
  try {
    return createServerResponseAdapter(req.signal, (res) => {
      console.log("Server response adapter created, passing to mcpHandler");
      try {
        mcpHandler(req, res);
        console.log("mcpHandler invoked successfully");
      } catch (error) {
        console.error("Error in mcpHandler:", error);
        res.writeHead(500).end(JSON.stringify({ error: "Internal server error in mcpHandler" }));
      }
    });
  } catch (error) {
    console.error("Error in SSE route handler:", error);
    return new Response(JSON.stringify({ error: "Internal server error in SSE handler" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
