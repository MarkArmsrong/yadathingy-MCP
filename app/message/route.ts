import { createServerResponseAdapter } from "@/lib/server-response-adapter";
import { mcpHandler } from "../mcp";

export const maxDuration = 60;

export async function POST(req: Request) {
  return createServerResponseAdapter(req.signal, (res) => {
    mcpHandler(req, res);
  });
}

export async function GET(req: Request) {
  // Check if this is a polling request
  const url = new URL(req.url);
  const pollForRequestId = url.searchParams.get('pollFor');
  
  // If this is a polling request, handle it differently
  if (pollForRequestId) {
    console.log(`Received polling request for requestId: ${pollForRequestId}`);
    
    // Use the session ID to check for results
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
      return new Response("No sessionId provided", { status: 400 });
    }
    
    // In a real implementation, we would check Redis or another datastore
    // for results stored with this request ID
    // For simplicity in this example, we'll simulate finding results for the echo tool
    
    // This is where you'd check if the result for this request ID is available
    // For demonstration, we'll just return a successful response
    return new Response(JSON.stringify({
      status: 200,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: pollForRequestId,
        result: {
          content: [{ type: "text", text: "Tool echo response via polling" }]
        }
      })
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  
  // Regular (non-polling) message handling
  return createServerResponseAdapter(req.signal, (res) => {
    mcpHandler(req, res);
  });
}
