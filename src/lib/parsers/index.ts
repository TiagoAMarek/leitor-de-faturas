import type { ParsedStatement } from '../types';
import { parseItauStatement } from './itau';
import { parseOfxStatement } from './ofx';
import { BANK_DETECTION } from '../constants';

export { parseItauStatement } from './itau';
export { parseOfxStatement } from './ofx';

/**
 * Generic parser entry point.
 * Detects bank from text content and delegates to the appropriate parser.
 */
export function parseStatement(text: string): ParsedStatement {
  // Detect OFX
  if (BANK_DETECTION.OFX_MARKERS.some((marker) => text.includes(marker))) {
    return parseOfxStatement(text);
  }

  // Detect Itaú PDF
  if (BANK_DETECTION.ITAU_MARKERS.some((marker) => text.includes(marker))) {
    return parseItauStatement(text);
  }

  // Fallback: try Itaú parser anyway (most common format)
  return parseItauStatement(text);
}
