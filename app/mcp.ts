import { z } from "zod";
import { initializeMcpApiHandler } from "../lib/mcp-api-handler";

export const mcpHandler = initializeMcpApiHandler(
  (server) => {
    // Add more tools, resources, and prompts here
    server.tool(
      "echo",
      "Returns the message you give it",
      { message: z.string() },
      async ({ message }) => ({
        content: [{ type: "text", text: `Tool echo: ${message}` }],
      })
    );
    
    // Weather forecast tool
    server.tool(
      "getWeather",
      "Get the weather forecast for a location",
      { 
        location: z.string().describe("The city and country"),
        days: z.number().optional().describe("Number of days to forecast") 
      },
      async ({ location, days = 1 }) => ({
        content: [{ 
          type: "text", 
          text: `Weather forecast for ${location} for ${days} day(s): Sunny with a chance of AI.` 
        }],
      })
    );
    
    // Simple calculator tool
    server.tool(
      "calculate",
      "Perform a simple calculation",
      { 
        expression: z.string().describe("Mathematical expression to evaluate") 
      },
      async ({ expression }) => {
        try {
          // Note: eval is used for demonstration - in production use a safer alternative
          const result = eval(expression);
          return {
            content: [{ type: "text", text: `Result: ${result}` }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: Could not calculate "${expression}"` }],
          };
        }
      }
    );
  },
  {
    capabilities: {
      tools: {
        echo: {
          description: "Echo a message",
        },
        getWeather: {
          description: "Get weather forecast",
        },
        calculate: {
          description: "Calculate a mathematical expression",
        },
      },
    },
  }
);
