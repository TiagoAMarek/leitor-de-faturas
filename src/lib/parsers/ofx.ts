import type { ParsedStatement, Transaction } from '../types';
import { detectCategory } from '../categories';
import { cleanDescription } from '../utils';

/**
 * Parse an OFX (SGML) file into a ParsedStatement.
 */
export function parseOfxStatement(text: string): ParsedStatement {
  const transactions: Transaction[] = [];
  const stmttrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;

  while ((match = stmttrnRegex.exec(text)) !== null) {
    const block = match[1];

    const trnamtMatch = block.match(/<TRNAMT>([\s\d.,-]+)<\/TRNAMT>/);
    const dtpostedMatch = block.match(/<DTPOSTED>(\d{8})/); // YYYYMMDD
    const memoMatch = block.match(/<MEMO>(.*?)<\/MEMO>/);

    if (trnamtMatch && dtpostedMatch && memoMatch) {
      const rawAmount = parseFloat(trnamtMatch[1]);
      const dateStr = dtpostedMatch[1];
      const description = memoMatch[1].trim();

      // Ignore payments and internal adjustments
      const ignoredMemos = [
        'Pagamento recebido',
        'Crédito de atraso',
        'Saldo em atraso',
        'Ajuste a crédito',
        'Encerramento de dívida',
        'Encargos',
      ];

      if (ignoredMemos.some((memo) => description.includes(memo))) continue;

      // Format date from YYYYMMDD to DD/MM
      const day = dateStr.substring(6, 8);
      const month = dateStr.substring(4, 6);
      const formattedDate = `${day}/${month}`;

      const category = detectCategory(description);

      transactions.push({
        date: formattedDate,
        description: cleanDescription(description),
        category,
        amount: Math.abs(rawAmount),
        city: '', // OFX usually doesn't have city in a separate field
      });
    }
  }

  // Extract Bank Info
  const orgMatch = text.match(/<ORG>(.*?)<\/ORG>/);
  const acctidMatch = text.match(/<ACCTID>(.*?)<\/ACCTID>/);
  const balMatch = text.match(/<BALAMT>([\s\d.,-]+)<\/BALAMT>/);

  // Use BALAMT if available, otherwise sum transactions
  let totalAmount = 0;
  if (balMatch) {
    totalAmount = Math.abs(parseFloat(balMatch[1]));
  } else {
    totalAmount = transactions.reduce((acc, tx) => acc + tx.amount, 0);
  }

  return {
    bankName: orgMatch ? orgMatch[1].trim() : 'Nubank',
    cardHolder: '', // Not usually in OFX
    cardNumber: acctidMatch ? acctidMatch[1].trim() : '',
    dueDate: '', // Not in OFX
    totalAmount,
    transactions,
  };
}
