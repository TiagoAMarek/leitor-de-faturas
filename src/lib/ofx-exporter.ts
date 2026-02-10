import type { ParsedStatement } from './parser';

/**
 * Infer the year from the dueDate field (DD/MM/YYYY format).
 * Falls back to the current year if dueDate is empty or unparseable.
 */
function inferYear(dueDate: string): number {
  if (dueDate) {
    const parts = dueDate.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[2], 10);
      if (!isNaN(year)) return year;
    }
  }
  return new Date().getFullYear();
}

/**
 * Convert a DD/MM date string to YYYYMMDD format using the inferred year.
 */
function toOfxDate(dateDdMm: string, year: number): string {
  const [day, month] = dateDdMm.split('/');
  return `${year}${month}${day}`;
}

/**
 * Generate a simple unique FITID per transaction based on date and index.
 */
function generateFitId(dateOfx: string, index: number): string {
  return `${dateOfx}${String(index).padStart(4, '0')}`;
}

/**
 * Convert a ParsedStatement into an OFX 1.0.2 (SGML) formatted string
 * suitable for import into financial software.
 */
export function generateOfx(statement: ParsedStatement): string {
  const year = inferYear(statement.dueDate);

  const header = [
    'OFXHEADER:100',
    'DATA:OFXSGML',
    'VERSION:102',
    'SECURITY:NONE',
    'ENCODING:UTF-8',
    'CHARSET:1252',
    'COMPRESSION:NONE',
    'OLDFILEUID:NONE',
    'NEWFILEUID:NONE',
  ].join('\n');

  const transactions = statement.transactions
    .map((tx, i) => {
      const dateOfx = toOfxDate(tx.date, year);
      const fitId = generateFitId(dateOfx, i);
      const amount = (-Math.abs(tx.amount)).toFixed(2);

      return [
        '<STMTTRN>',
        '<TRNTYPE>DEBIT</TRNTYPE>',
        `<DTPOSTED>${dateOfx}</DTPOSTED>`,
        `<TRNAMT>${amount}</TRNAMT>`,
        `<FITID>${fitId}</FITID>`,
        `<MEMO>${tx.description}</MEMO>`,
        '</STMTTRN>',
      ].join('\n');
    })
    .join('\n');

  const balAmount = (-Math.abs(statement.totalAmount)).toFixed(2);

  const body = [
    '<OFX>',
    '<SIGNONMSGSRSV1>',
    '<SONRS>',
    '<STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>',
    '<LANGUAGE>POR</LANGUAGE>',
    '</SONRS>',
    '</SIGNONMSGSRSV1>',
    '<CREDITCARDMSGSRSV1>',
    '<CCSTMTTRNRS>',
    '<TRNUID>1</TRNUID>',
    '<STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>',
    '<CCSTMTRS>',
    '<CURDEF>BRL</CURDEF>',
    '<CCACCTFROM>',
    `<ACCTID>${statement.cardNumber}</ACCTID>`,
    '</CCACCTFROM>',
    '<BANKTRANLIST>',
    transactions,
    '</BANKTRANLIST>',
    '<LEDGERBAL>',
    `<BALAMT>${balAmount}</BALAMT>`,
    '</LEDGERBAL>',
    '</CCSTMTRS>',
    '</CCSTMTTRNRS>',
    '</CREDITCARDMSGSRSV1>',
    `<FI><ORG>${statement.bankName}</ORG></FI>`,
    '</OFX>',
  ].join('\n');

  return `${header}\n\n${body}\n`;
}
