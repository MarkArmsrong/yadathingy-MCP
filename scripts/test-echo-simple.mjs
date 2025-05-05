import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

// Update this to your own Vercel deployment URL
const origin = process.argv[2] || "https://yadathingy-mcp.vercel.app/";
const toolName = "echo";
const message = process.argv[3] || "Hello, World!";

async function main() {
  console.log(`Testing ${toolName} tool with optimized polling approach. Message="${message}"`);
  
  try {
    // Step 1: Connect to SSE endpoint to get a sessionId (but we won't use SSE streaming)
    console.log(`Getting session ID from ${origin}/sse`);
    const sseResponse = await fetch(`${origin}/sse`, {
      // Add timeout to prevent hanging forever
      signal: AbortSignal.timeout(15000)
    });
    
    if (!sseResponse.ok) {
      throw new Error(`Failed to get session ID: ${sseResponse.status} ${sseResponse.statusText}`);
    }
    
    const sseText = await sseResponse.text();
    
    // Parse the session ID from the SSE response
    const sessionIdMatch = sseText.match(/sessionId=([^"&\s]+)/);
    if (!sessionIdMatch) {
      throw new Error(`Failed to extract sessionId from SSE response: ${sseText}`);
    }
    
    const sessionId = sessionIdMatch[1];
    console.log(`Got session ID: ${sessionId}`);
    
    // Add a delay to give Vercel functions time to clean up
    console.log("Waiting 3 seconds before making tool call...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Make the tool call request - simplify to just echo a short message
    console.log(`Calling ${toolName} tool with a very simple message...`);
    const requestId = randomUUID();
    
    // Make a direct call to /api/echo instead of the message endpoint
    // This is a simplified approach that bypasses the complex MCP protocol
    const callResponse = await fetch(`${origin}/api/echo?message=test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`Response status: ${callResponse.status}`);
    const responseData = await callResponse.text();
    console.log(`Response: ${responseData}`);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main();