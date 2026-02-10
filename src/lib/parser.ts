/**
 * Barrel re-export for backward compatibility.
 *
 * All logic has been split into:
 *   - types.ts        — Transaction, ParsedStatement interfaces
 *   - categories.ts   — category icons, colors, detection
 *   - utils.ts        — cleanDescription, formatCity, parseAmount
 *   - parsers/itau.ts — Itaú PDF parser
 *   - parsers/ofx.ts  — OFX parser
 *   - parsers/index.ts — parseStatement entry point
 */

// Types
export type { Transaction, ParsedStatement } from './types';

// Categories
export { getCategoryIcon, getCategoryColor, detectCategory, inferCategory } from './categories';

// Parsers
export { parseStatement, parseItauStatement, parseOfxStatement, parseCsvStatement } from './parsers';
