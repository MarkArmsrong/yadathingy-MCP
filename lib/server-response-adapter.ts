import { EventEmitter } from "node:events";

import { type ServerResponse } from "node:http";

type WriteheadArgs = {
  statusCode: number;
  headers?: Record<string, string>;
};

/**
 * Anthropic's MCP API requires a server response object. This function
 * creates a fake server response object that can be used to pass to the MCP API.
 */
export function createServerResponseAdapter(
  signal: AbortSignal,
  fn: (re: ServerResponse) => Promise<void> | void
): Promise<Response> {
  console.log("Creating server response adapter");
  let writeHeadResolver: (v: WriteheadArgs) => void;
  const writeHeadPromise = new Promise<WriteheadArgs>(
    async (resolve, reject) => {
      writeHeadResolver = resolve;
    }
  );

  return new Promise(async (resolve, reject) => {
    console.log("Inside server response adapter promise");
    let controller: ReadableStreamController<Uint8Array> | undefined;
    let shouldClose = false;
    let wroteHead = false;

    const writeHead = (
      statusCode: number,
      headers?: Record<string, string>
    ) => {
      console.log(`Server adapter writeHead called with status ${statusCode}`);
      if (typeof headers === "string") {
        throw new Error("Status message of writeHead not supported");
      }
      wroteHead = true;
      writeHeadResolver({
        statusCode,
        headers,
      });
      return fakeServerResponse;
    };

    let bufferedData: Uint8Array[] = [];

    const write = (
      chunk: Buffer | string,
      encoding?: BufferEncoding
    ): boolean => {
      console.log(`Server adapter write called with chunk length ${typeof chunk === 'string' ? chunk.length : 'buffer'}`);
      if (encoding) {
        throw new Error("Encoding not supported");
      }
      if (chunk instanceof Buffer) {
        throw new Error("Buffer not supported");
      }
      if (!wroteHead) {
        writeHead(200);
      }
      if (!controller) {
        bufferedData.push(new TextEncoder().encode(chunk as string));
        return true;
      }
      controller.enqueue(new TextEncoder().encode(chunk as string));
      return true;
    };

    const eventEmitter = new EventEmitter();

    const fakeServerResponse = {
      writeHead,
      write,
      end: (data?: Buffer | string) => {
        console.log("Server adapter end called");
        if (data) {
          write(data);
        }

        if (!controller) {
          shouldClose = true;
          return fakeServerResponse;
        }
        try {
          controller.close();
        } catch (error) {
          console.error("Error closing controller:", error);
          /* May be closed on tcp layer */
        }
        return fakeServerResponse;
      },
      on: (event: string, listener: (...args: any[]) => void) => {
        console.log(`Server adapter on event: ${event}`);
        eventEmitter.on(event, listener);
        return fakeServerResponse;
      },
    };

    signal.addEventListener("abort", () => {
      console.log("Abort signal received in server response adapter");
      eventEmitter.emit("close");
    });

    try {
      console.log("Calling handler function in server response adapter");
      await fn(fakeServerResponse as ServerResponse);
      console.log("Handler function completed in server response adapter");
    } catch (error) {
      console.error("Error in server response adapter handler:", error);
    }

    try {
      console.log("Waiting for writeHead promise");
      const head = await writeHeadPromise;
      console.log("WriteHead promise resolved");

      const response = new Response(
        new ReadableStream({
          start(c) {
            console.log("ReadableStream start called");
            controller = c;
            for (const chunk of bufferedData) {
              controller.enqueue(chunk);
            }
            if (shouldClose) {
              controller.close();
            }
            console.log("ReadableStream setup completed");
          },
        }),
        {
          status: head.statusCode,
          headers: head.headers,
        }
      );

      console.log("Resolving server response adapter promise");
      resolve(response);
    } catch (error) {
      console.error("Error in writeHead promise handling:", error);
      reject(error);
    }
  });
}
