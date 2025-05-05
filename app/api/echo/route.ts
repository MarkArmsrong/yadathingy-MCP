export async function GET(req: Request) {
  try {
    // Get the message from the query string
    const url = new URL(req.url);
    const message = url.searchParams.get('message') || 'No message provided';
    
    // Simple echo response without any complex processing
    return new Response(`Echo API: ${message}`, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  } catch (error) {
    return new Response(`Error: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}

export async function POST(req: Request) {
  try {
    // Support both JSON body and query params for flexibility
    let message: string;
    
    // Try to get message from request body
    try {
      const body = await req.json();
      message = body.message || 'No message provided in body';
    } catch (e) {
      // If body parsing fails, try query params
      const url = new URL(req.url);
      message = url.searchParams.get('message') || 'No message provided';
    }
    
    // Simple echo response without any complex processing
    return new Response(`Echo API (POST): ${message}`, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  } catch (error) {
    return new Response(`Error: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}