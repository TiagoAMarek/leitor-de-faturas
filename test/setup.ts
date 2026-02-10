import '@testing-library/jest-dom';
import { afterAll, beforeAll, vi } from 'vitest';

// Mock pdf-parse globally
vi.mock('pdf-parse', () => ({
  PDFParse: vi.fn(),
  getPath: vi.fn(() => 'mock-worker-path'),
}));

// Suppress console errors in tests unless they're unexpected
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Allow expected errors to be logged
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
