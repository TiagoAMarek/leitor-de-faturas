import type { ParsedStatement, Transaction } from '../types';
import { detectCategory, inferCategory } from '../categories';
import { cleanDescription, formatCity, parseAmount } from '../utils';

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

    if (line.startsWith('Cartão') && line.includes('XXXX')) {
      cardNumber = line.replace('Cartão', '').trim();
    }
    if (line.startsWith('Vencimento:')) {
      dueDate = line.replace('Vencimento:', '').trim();
    }
    if (line.startsWith('Titular')) {
      cardHolder = line.replace('Titular', '').trim();
    }
    if (line === 'Total desta fatura') {
      const nextLine = lines[i + 1];
      if (nextLine) {
        const val = parseAmount(nextLine);
        if (val !== null) totalAmount = val;
      }
    }
    if (line.startsWith('O total da sua fatura é:')) {
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

    if (/^Lançamentos:/.test(line) || /^Lançamentos no cartão/.test(line)) {
      inTransactionSection = true;
      continue;
    }

    if (
      line.startsWith('Total dos lançamentos') ||
      line.startsWith('Caso você pague')
    ) {
      inTransactionSection = false;
      continue;
    }

    if (!inTransactionSection) continue;

    // Skip headers
    if (
      line === 'DATA ESTABELECIMENTO VALOR EM R$' ||
      line === 'DATA VALOR EM R$'
    )
      continue;

    // Match transaction line: DD/MM DESCRIPTION VALUE
    const txMatch = line.match(/^(\d{2}\/\d{2})\s+(.+?)\s+([\d.,]+)$/);
    if (txMatch) {
      const [, dateStr, rawDesc, amountStr] = txMatch;
      const amount = parseAmount(amountStr);
      if (amount === null) continue;

      // Check for installment info (e.g., "03/03" in description)
      let description = rawDesc.trim();
      let installment: string | undefined;
      const installmentMatch = description.match(/\s+(\d{2}\/\d{2})$/);
      if (installmentMatch) {
        installment = installmentMatch[1];
        description = description.replace(/\s+\d{2}\/\d{2}$/, '').trim();
      }

      // Next line might be category + city
      let category = 'outros';
      let city = '';
      const nextLine = lines[i + 1];
      if (
        nextLine &&
        !/^\d{2}\/\d{2}\s/.test(nextLine) &&
        !nextLine.startsWith('Lançamentos') &&
        !nextLine.startsWith('Total') &&
        !nextLine.startsWith('Caso')
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
