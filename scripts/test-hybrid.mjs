import fetch from 'node-fetch';
import { createClient } from 'redis';
import { randomUUID } from 'crypto';

// Use the Redis URL from command line or .env.prod file
const REDIS_URL = process.argv[2] || 'rediss://default:AT7WAAIjcDE5ZGEzYzk5YjExNDk0YzQwYjk4MTUyNTgwYWJmM2IzYXAxMA@fit-mollusk-16086.upstash.io:6379';

// Update this to your own Vercel deployment URL
const origin = process.argv[3] || "https://yadathingy-mcp.vercel.app/";
const toolName = process.argv[4] || "echo"; // Default to echo as it's simpler
const toolParams = process.argv[5] ? JSON.parse(process.argv[5]) : { message: "Hello, hybrid test!" };

async function main() {
  console.log(`Testing ${toolName} tool with hybrid approach (direct Redis + SSE)`);
  console.log(`Tool parameters: ${JSON.stringify(toolParams)}`);
  
  try {
    // Step 1: Initialize Redis clients - one for subscribing, one for publishing
    console.log("Initializing Redis clients...");
    const redisSubscriber = createClient({
      url: REDIS_URL,
    });
    
    const redisPublisher = createClient({
      url: REDIS_URL,
    });
    
    redisSubscriber.on("error", (err) => {
      console.error("Redis subscriber error:", err);
    });
    
    redisPublisher.on("error", (err) => {
      console.error("Redis publisher error:", err);
    });
    
    await Promise.all([
      redisSubscriber.connect(),
      redisPublisher.connect()
    ]);
    console.log("Connected to Redis successfully with both clients");
    
    // Step 2: Connect to SSE endpoint to get a sessionId
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
    
    // Step 3: Create a unique request ID
    const requestId = randomUUID();
    console.log(`Using request ID: ${requestId}`);
    
    // Step 4: Subscribe to the responses channel for this request
    console.log(`Subscribing to Redis responses channel for ${sessionId}:${requestId}`);
    
    let responseReceived = false;
    await redisSubscriber.subscribe(`responses:${sessionId}:${requestId}`, (message) => {
      console.log(`Received response from Redis channel: ${message}`);
      try {
        const response = JSON.parse(message);
        console.log(`Response status: ${response.status}`);
        console.log(`Response body: ${response.body}`);
        responseReceived = true;
      } catch (error) {
        console.error("Error parsing response:", error);
      }
    });
    
    // Step 5: Manually craft and publish the request to Redis using the publisher client
    console.log(`Creating request for ${toolName} tool...`);
    const serializedRequest = {
      requestId,
      url: `/message?sessionId=${sessionId}`,
      method: "POST",
      body: {
        jsonrpc: "2.0",
        id: requestId,
        method: "callTool",
        params: {
          name: toolName,
          parameters: toolParams
        }
      },
      headers: {
        "content-type": "application/json"
      }
    };
    
    console.log(`Publishing request to Redis channel: requests:${sessionId}`);
    const publishResult = await redisPublisher.publish(`requests:${sessionId}`, JSON.stringify(serializedRequest));
    console.log(`Publish result: ${publishResult} clients received the message`);
    
    // Step 6: Wait for a response with a timeout
    console.log("Waiting for response (30 second timeout)...");
    
    const waitForResponse = async (timeoutMs) => {
      return new Promise((resolve) => {
        const checkInterval = 500; // Check every 500ms
        let elapsed = 0;
        
        const intervalId = setInterval(() => {
          elapsed += checkInterval;
          
          if (responseReceived) {
            clearInterval(intervalId);
            resolve(true);
          } else if (elapsed >= timeoutMs) {
            clearInterval(intervalId);
            resolve(false);
          }
        }, checkInterval);
      });
    };
    
    const responseSuccess = await waitForResponse(30000); // 30 second timeout
    
    if (responseSuccess) {
      console.log("Response received successfully!");
    } else {
      console.error("Timed out waiting for response after 30 seconds");
      
      // Let's try to debug what might have happened
      console.log("Checking if session is still valid in Redis...");
      try {
        const channelPatterns = await redisPublisher.pubSubChannels(`requests:${sessionId}`);
        console.log(`Channel patterns: ${JSON.stringify(channelPatterns)}`);
      } catch (error) {
        console.error("Error checking channel patterns:", error);
      }
      
      // Try making a direct HTTP request to the message endpoint as a fallback
      console.log("Trying direct HTTP request to message endpoint...");
      try {
        const httpResponse = await fetch(`${origin}/message?sessionId=${sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: randomUUID(),
            method: "callTool",
            params: {
              name: toolName,
              parameters: toolParams
            }
          })
        });
        
        console.log(`HTTP response status: ${httpResponse.status}`);
        const httpData = await httpResponse.text();
        console.log(`HTTP response data: ${httpData}`);
      } catch (httpError) {
        console.error("Error with direct HTTP request:", httpError);
      }
    }
    
    // Clean up
    console.log("Cleaning up Redis connections...");
    await redisSubscriber.unsubscribe(`responses:${sessionId}:${requestId}`);
    await redisSubscriber.disconnect();
    await redisPublisher.disconnect();
    console.log("Clean up complete");
    
  } catch (error) {
    console.error("Error in hybrid test:", error);
  }
}

main();