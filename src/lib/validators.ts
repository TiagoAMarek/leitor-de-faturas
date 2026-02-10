/**
 * File validation utilities to avoid code duplication.
 */

import { MAX_FILE_SIZE, SUPPORTED_FILE_EXTENSIONS, SUPPORTED_MIME_TYPES } from './constants';

/**
 * Validate if file size is within acceptable limits.
 */
export function isFileSizeValid(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Check if file extension is supported.
 */
export function hasValidExtension(fileName: string): boolean {
  const lowerCaseName = fileName.toLowerCase();
  return SUPPORTED_FILE_EXTENSIONS.some((ext) => lowerCaseName.endsWith(ext));
}

/**
 * Check if file is a PDF based on extension or MIME type.
 */
export function isPdfFile(file: File): boolean {
  return (
    hasFileExtension(file.name, '.pdf') || SUPPORTED_MIME_TYPES.pdf.includes(file.type)
  );
}

/**
 * Check if file is an OFX based on extension or MIME type.
 */
export function isOfxFile(file: File): boolean {
  return (
    hasFileExtension(file.name, '.ofx') || SUPPORTED_MIME_TYPES.ofx.includes(file.type)
  );
}

/**
 * Check if file type is supported (PDF or OFX).
 */
export function isFileTypeSupported(file: File): boolean {
  return isPdfFile(file) || isOfxFile(file);
}

/**
 * Helper function to check if a filename has a specific extension.
 */
function hasFileExtension(fileName: string, extension: string): boolean {
  return fileName.toLowerCase().endsWith(extension);
}
