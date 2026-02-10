import type { ParsedStatement } from '../types';
import { parseItauStatement } from './itau';
import { parseOfxStatement } from './ofx';

export { parseItauStatement } from './itau';
export { parseOfxStatement } from './ofx';

/**
 * Generic parser entry point.
 * Detects bank from text content and delegates to the appropriate parser.
 */
export function parseStatement(text: string): ParsedStatement {
  // Detect OFX
  if (text.includes('<OFX>') || text.includes('OFXHEADER')) {
    return parseOfxStatement(text);
  }

  // Detect Itaú PDF
  if (
    text.includes('Itaú') ||
    text.includes('itau') ||
    text.includes('ITAÚ') ||
    text.includes('Cartões')
  ) {
    return parseItauStatement(text);
  }

  // Fallback: try Itaú parser anyway (most common format)
  return parseItauStatement(text);
}
