import { createServerResponseAdapter } from "@/lib/server-response-adapter";
import { mcpHandler } from "../mcp";

export const maxDuration = 60;

const handler = (req: Request) => {
  console.log(`MCP ${req.method} route handler called`);
  try {
    return createServerResponseAdapter(req.signal, (res) => {
      console.log("Server response adapter created for MCP, passing to mcpHandler");
      try {
        mcpHandler(req, res);
        console.log("mcpHandler for MCP invoked successfully");
      } catch (error) {
        console.error("Error in mcpHandler for MCP:", error);
        res.writeHead(500).end(JSON.stringify({ error: "Internal server error in mcpHandler" }));
      }
    });
  } catch (error) {
    console.error("Error in MCP route handler:", error);
    return new Response(JSON.stringify({ error: "Internal server error in MCP handler" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export { handler as GET };
export { handler as POST };
export { handler as DELETE };
