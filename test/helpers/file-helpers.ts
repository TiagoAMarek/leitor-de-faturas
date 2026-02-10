import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Create a File object from content (for testing file uploads)
 */
export function createMockFile(
  content: string,
  filename: string,
  mimeType: string
): File {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Load a fixture file from the fixtures directory
 */
export function loadFixture(name: string): string {
  const fixturePath = join(__dirname, '..', 'fixtures', name);
  return readFileSync(fixturePath, 'utf-8');
}

/**
 * Create FormData with a file for API testing
 */
export function createFormDataWithFile(file: File): FormData {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}
