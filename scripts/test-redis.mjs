// This is a simplified test script that checks if Redis is working properly
import { createClient } from "redis";

async function testRedisConnection() {
  console.log("Testing Redis connection directly...");
  
  try {
    // Get Redis URL from command line argument
    const redisUrl = process.argv[2];
    if (!redisUrl) {
      console.error("No Redis URL provided. Please provide it as an argument:");
      console.error("node scripts/test-redis.mjs \"your-redis-url\"");
      console.error("\nYou need to get the REDIS_URL from your Vercel project settings:");
      console.error("1. Go to Vercel dashboard");
      console.error("2. Select your yadathingy-MCP project");
      console.error("3. Go to Settings > Environment Variables");
      console.error("4. Copy the value of REDIS_URL");
      process.exit(1);
    }
    
    // For security, only show part of the URL in logs
    const redisUrlDisplay = redisUrl.includes("://") 
      ? redisUrl.substring(0, redisUrl.indexOf("://") + 3) + "..." + redisUrl.substring(redisUrl.lastIndexOf('@') > -1 ? redisUrl.lastIndexOf('@') : redisUrl.length - 10)
      : "...";
    
    console.log("Connecting to Redis at:", redisUrlDisplay);
    
    const redis = createClient({
      url: redisUrl,
    });
    
    redis.on("error", (err) => {
      console.error("Redis error:", err);
    });
    
    console.log("Attempting to connect to Redis...");
    await redis.connect();
    console.log("Successfully connected to Redis!");
    
    // Try a simple set/get operation
    const testKey = "test-key-" + Date.now();
    const testValue = "test-value-" + Date.now();
    
    console.log(`Setting test key: ${testKey} = ${testValue}`);
    await redis.set(testKey, testValue);
    
    console.log(`Getting test key: ${testKey}`);
    const retrievedValue = await redis.get(testKey);
    
    if (retrievedValue === testValue) {
      console.log("Redis set/get test successful!");
    } else {
      console.error(`Redis set/get test failed. Expected: ${testValue}, Got: ${retrievedValue}`);
    }
    
    // Try a pub/sub operation
    const channel = "test-channel-" + Date.now();
    console.log(`Testing pub/sub on channel: ${channel}`);
    
    let messageReceived = false;
    await redis.subscribe(channel, (message) => {
      console.log(`Received message on channel ${channel}: ${message}`);
      messageReceived = true;
    });
    
    // Create a separate publisher
    const publisher = redis.duplicate();
    await publisher.connect();
    
    console.log(`Publishing message to channel: ${channel}`);
    await publisher.publish(channel, "Hello Redis!");
    
    // Give it a second to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (messageReceived) {
      console.log("Redis pub/sub test successful!");
    } else {
      console.error("Redis pub/sub test failed - no message received");
    }
    
    // Clean up
    await redis.unsubscribe(channel);
    await redis.disconnect();
    await publisher.disconnect();
    
    console.log("Redis tests completed successfully");
  } catch (error) {
    console.error("Error testing Redis:", error);
  }
}

// Run the test
testRedisConnection();