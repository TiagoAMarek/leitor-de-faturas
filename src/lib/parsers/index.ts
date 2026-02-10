import type { ParsedStatement } from '../types';
import { parseItauStatement } from './itau';
import { parseOfxStatement } from './ofx';
import { parseCsvStatement } from './csv';
import { BANK_DETECTION } from '../constants';

export { parseItauStatement } from './itau';
export { parseOfxStatement } from './ofx';
export { parseCsvStatement } from './csv';

/**
 * Generic parser entry point.
 * Detects bank from text content and delegates to the appropriate parser.
 */
export function parseStatement(text: string): ParsedStatement {
  // Detect OFX
  if (BANK_DETECTION.OFX_MARKERS.some((marker) => text.includes(marker))) {
    return parseOfxStatement(text);
  }

  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  const normalizedFirstLine = firstLine ? firstLine.toLowerCase() : '';
  if (BANK_DETECTION.CSV_MARKERS.some((marker) => normalizedFirstLine.startsWith(marker))) {
    return parseCsvStatement(text);
  }

  // Detect Itaú PDF
  if (BANK_DETECTION.ITAU_MARKERS.some((marker) => text.includes(marker))) {
    return parseItauStatement(text);
  }

  // Fallback: try Itaú parser anyway (most common format)
  return parseItauStatement(text);
}
