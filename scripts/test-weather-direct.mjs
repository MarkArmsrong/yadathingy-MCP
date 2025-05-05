import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

// Update this to your own Vercel deployment URL
const origin = process.argv[2] || "https://yadathingy-mcp.vercel.app/";
const location = process.argv[3] || "Seattle, USA";
const days = parseInt(process.argv[4] || "3");

async function main() {
  console.log(`Testing getWeather tool with location=${location}, days=${days} using direct HTTP approach`);
  
  try {
    // Step 1: Connect to SSE endpoint to get a sessionId
    console.log(`Connecting to SSE endpoint at ${origin}/sse`);
    const sseResponse = await fetch(`${origin}/sse`);
    const sseText = await sseResponse.text();
    
    // Parse the session ID from the SSE response
    const sessionIdMatch = sseText.match(/sessionId=([^"&\s]+)/);
    if (!sessionIdMatch) {
      throw new Error(`Failed to extract sessionId from SSE response: ${sseText}`);
    }
    
    const sessionId = sessionIdMatch[1];
    console.log(`Got session ID: ${sessionId}`);
    
    // Step 2: Call the weather tool via the message endpoint
    console.log(`Calling getWeather tool via message endpoint...`);
    const messageRequest = {
      jsonrpc: "2.0",
      id: randomUUID(),
      method: "callTool",
      params: {
        name: "getWeather",
        parameters: {
          location,
          days
        }
      }
    };
    
    const messageResponse = await fetch(`${origin}/message?sessionId=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageRequest)
    });
    
    console.log(`Message endpoint response status: ${messageResponse.status}`);
    const messageData = await messageResponse.text();
    console.log(`Message endpoint response data: ${messageData}`);
    
    // If we got a response other than "Accepted", try to parse it as JSON
    if (messageData && messageData !== "Accepted") {
      try {
        const jsonResponse = JSON.parse(messageData);
        console.log("Parsed JSON response:", jsonResponse);
      } catch (e) {
        console.log("Response is not JSON parseable");
      }
    }
    
    console.log("Direct HTTP test completed");
  } catch (error) {
    console.error("Error details:", error);
  }
}

main();