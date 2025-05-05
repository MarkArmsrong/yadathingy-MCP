import { createServerResponseAdapter } from "@/lib/server-response-adapter";
import { mcpHandler } from "../mcp";

// Increasing timeout to match vercel.json configuration
export const maxDuration = 60;

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
