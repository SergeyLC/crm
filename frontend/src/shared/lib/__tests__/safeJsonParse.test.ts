import { safeJsonParse } from '../safeJsonParse';

// Mock Response for Node.js test environment
class MockResponse {
  private body: string;

  constructor(body: string) {
    this.body = body;
  }

  async text(): Promise<string> {
    return this.body;
  }
}

describe('safeJsonParse', () => {
  it('should parse valid JSON', async () => {
    const mockResponse = new MockResponse(JSON.stringify({ foo: 'bar' })) as unknown as Response;
    const result = await safeJsonParse(mockResponse);
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should return empty object for empty response', async () => {
    const mockResponse = new MockResponse('') as unknown as Response;
    const result = await safeJsonParse(mockResponse);
    expect(result).toEqual({});
  });

  it('should return empty object for whitespace-only response', async () => {
    const mockResponse = new MockResponse('   ') as unknown as Response;
    const result = await safeJsonParse(mockResponse);
    expect(result).toEqual({});
  });

  it('should throw error for invalid JSON', async () => {
    const mockResponse = new MockResponse('not valid json') as unknown as Response;
    await expect(safeJsonParse(mockResponse)).rejects.toThrow('Invalid JSON response from server');
  });

  it('should parse arrays', async () => {
    const mockResponse = new MockResponse(JSON.stringify([1, 2, 3])) as unknown as Response;
    const result = await safeJsonParse(mockResponse);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse null', async () => {
    const mockResponse = new MockResponse('null') as unknown as Response;
    const result = await safeJsonParse(mockResponse);
    expect(result).toBeNull();
  });
});
