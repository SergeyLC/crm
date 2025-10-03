/// <reference types="jest" />

// Strong Jest type definitions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toBeNull(): R;
      toHaveTextContent(text: string): R;
      toBeVisible(): R;
      toHaveValue(value: string | number | string[]): R;
    }
  }

  const expect: jest.Expect;
}

export {};