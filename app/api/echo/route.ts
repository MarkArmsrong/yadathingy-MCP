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