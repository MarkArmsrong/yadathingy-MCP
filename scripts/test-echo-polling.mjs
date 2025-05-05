import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

// Update this to your own Vercel deployment URL
const origin = process.argv[2] || "https://yadathingy-mcp.vercel.app/";
const toolName = "echo";
const message = process.argv[3] || "Hello, World!";

async function main() {
  console.log(`Testing ${toolName} tool with polling approach. Message="${message}"`);
  
  try {
    // Step 1: Connect to SSE endpoint to get a sessionId (but we won't use SSE streaming)
    console.log(`Getting session ID from ${origin}/sse`);
    const sseResponse = await fetch(`${origin}/sse`);
    const sseText = await sseResponse.text();
    
    // Parse the session ID from the SSE response
    const sessionIdMatch = sseText.match(/sessionId=([^"&\s]+)/);
    if (!sessionIdMatch) {
      throw new Error(`Failed to extract sessionId from SSE response: ${sseText}`);
    }
    
    const sessionId = sessionIdMatch[1];
    console.log(`Got session ID: ${sessionId}`);
    
    // Step 2: Make the tool call request
    console.log(`Calling ${toolName} tool...`);
    const requestId = randomUUID();
    
    const callResponse = await fetch(`${origin}/message?sessionId=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId, // Adding a request ID to track this specific request
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: requestId,
        method: "callTool",
        params: {
          name: toolName,
          parameters: { message }
        }
      })
    });
    
    console.log(`Initial response status: ${callResponse.status}`);
    
    // If we got an immediate response (not "Accepted"), handle it
    if (callResponse.status !== 202) { // 202 is Accepted
      const responseData = await callResponse.text();
      console.log(`Tool response: ${responseData}`);
      return;
    }
    
    // Step 3: Poll for result using the session ID and request ID
    console.log(`Request accepted, starting polling for result...`);
    
    // Poll for up to 30 seconds
    const MAX_POLLS = 15;
    const POLL_INTERVAL = 2000; // 2 seconds
    
    for (let i = 0; i < MAX_POLLS; i++) {
      console.log(`Poll attempt ${i+1}/${MAX_POLLS}...`);
      
      // Wait for the polling interval
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      
      try {
        // Check for result using a special polling endpoint
        // Note: In a real implementation, you would add a /poll endpoint to your server
        const pollResponse = await fetch(`${origin}/message?sessionId=${sessionId}&pollFor=${requestId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (pollResponse.status === 200) {
          const resultData = await pollResponse.text();
          
          // If we got a result that's not "still processing", we're done
          if (resultData && resultData !== "still processing") {
            console.log(`Result received on poll ${i+1}: ${resultData}`);
            return;
          }
        }
      } catch (pollError) {
        console.error(`Error during poll attempt ${i+1}:`, pollError);
      }
    }
    
    console.log("Polling timed out after 30 seconds, no result received");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main();