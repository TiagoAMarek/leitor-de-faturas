/**
 * Shared string utilities for statement parsing.
 */

/** Remove trailing city codes stuck at the end of descriptions. */
export function cleanDescription(desc: string): string {
  return desc
    .replace(/BR$/, '')
    .replace(/([A-Z])B$/, '$1')
    .replace(/([A-Z])P$/, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Title-case a city name and strip trailing "BR". */
export function formatCity(city: string): string {
  if (!city) return '';
  return city
    .replace(/BR$/, '')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/** Parse a Brazilian currency string ("1.234,56") into a number, or null. */
export function parseAmount(str: string): number | null {
  const cleaned = str
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
