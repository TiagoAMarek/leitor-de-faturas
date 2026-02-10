import type { ParsedStatement, Transaction } from '../types';
import { detectCategory, inferCategory } from '../categories';
import { cleanDescription, formatCity, parseAmount } from '../utils';
import {
  ITAU_LABELS,
  ITAU_PATTERNS,
  ITAU_TRANSACTION_START_MARKERS,
  ITAU_TRANSACTION_END_MARKERS,
  ITAU_NEXTLINE_SKIP_PREFIXES,
} from '../constants';

/**
 * Parse an Itaú credit card statement from extracted PDF text.
 */
export function parseItauStatement(text: string): ParsedStatement {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract metadata
  let cardHolder = '';
  let cardNumber = '';
  let dueDate = '';
  let totalAmount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith(ITAU_LABELS.CARD_PREFIX) && line.includes('XXXX')) {
      cardNumber = line.replace(ITAU_LABELS.CARD_PREFIX, '').trim();
    }
    if (line.startsWith(ITAU_LABELS.DUE_DATE_PREFIX)) {
      dueDate = line.replace(ITAU_LABELS.DUE_DATE_PREFIX, '').trim();
    }
    if (line.startsWith(ITAU_LABELS.CARD_HOLDER_PREFIX)) {
      cardHolder = line.replace(ITAU_LABELS.CARD_HOLDER_PREFIX, '').trim();
    }
    if (line === ITAU_LABELS.TOTAL_LABEL) {
      const nextLine = lines[i + 1];
      if (nextLine) {
        const val = parseAmount(nextLine);
        if (val !== null) totalAmount = val;
      }
    }
    if (line.startsWith(ITAU_LABELS.TOTAL_LABEL_ALT)) {
      const nextLine = lines[i + 1];
      if (nextLine) {
        const val = parseAmount(nextLine);
        if (val !== null) totalAmount = val;
      }
    }
  }

  // Parse transactions
  const transactions: Transaction[] = [];
  let inTransactionSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (ITAU_TRANSACTION_START_MARKERS.some((marker) => line.startsWith(marker))) {
      inTransactionSection = true;
      continue;
    }

    if (ITAU_TRANSACTION_END_MARKERS.some((marker) => line.startsWith(marker))) {
      inTransactionSection = false;
      continue;
    }

    if (!inTransactionSection) continue;

    // Skip headers
    if (line === ITAU_LABELS.TABLE_HEADER_1 || line === ITAU_LABELS.TABLE_HEADER_2)
      continue;

    // Match transaction line: DD/MM DESCRIPTION VALUE
    const txMatch = line.match(ITAU_PATTERNS.TRANSACTION_LINE);
    if (txMatch) {
      const [, dateStr, rawDesc, amountStr] = txMatch;
      const amount = parseAmount(amountStr);
      if (amount === null) continue;

      // Check for installment info (e.g., "03/03" in description)
      let description = rawDesc.trim();
      let installment: string | undefined;
      const installmentMatch = description.match(ITAU_PATTERNS.INSTALLMENT_IN_DESC);
      if (installmentMatch) {
        installment = installmentMatch[1];
        description = description.replace(ITAU_PATTERNS.INSTALLMENT_IN_DESC, '').trim();
      }

      // Next line might be category + city
      let category = 'outros';
      let city = '';
      const nextLine = lines[i + 1];
      if (
        nextLine &&
        !ITAU_PATTERNS.DATE_PREFIX.test(nextLine) &&
        !ITAU_NEXTLINE_SKIP_PREFIXES.some((prefix) => nextLine.startsWith(prefix))
      ) {
        const parts = nextLine.split(/\s{2,}/);
        const rawCat = parts[0] || '';
        city = parts[1] || parts[0] || '';
        if (parts.length >= 2) {
          city = parts[parts.length - 1];
        }
        category = inferCategory(rawCat, description);
        i++; // skip the category line
      } else {
        category = detectCategory(description);
      }

      // Clean up description
      description = cleanDescription(description);

      transactions.push({
        date: dateStr,
        description,
        category,
        amount,
        city: formatCity(city),
        installment,
      });
    }
  }

  return {
    bankName: 'Itaú',
    cardHolder,
    cardNumber,
    dueDate,
    totalAmount,
    transactions,
  };
}
