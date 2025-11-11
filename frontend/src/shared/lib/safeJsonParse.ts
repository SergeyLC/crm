/**
 * Safely parse JSON from a Response object
 * Handles empty responses and invalid JSON gracefully
 */
export async function safeJsonParse<T = unknown>(response: Response): Promise<T> {
  const text = await response.text();
  
  if (!text || text.trim() === '') {
    return {} as T;
  }
  
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', {
      text,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Invalid JSON response from server');
  }
}
