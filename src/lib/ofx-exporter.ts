import type { ParsedStatement } from './types';

/**
 * Escape special XML/SGML characters in user-supplied content.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface DueDateParts {
  day: number;
  month: number;
  year: number;
}

/**
 * Parse dueDate in DD/MM/YYYY format.
 * Returns null when dueDate is empty or unparseable.
 */
function parseDueDateParts(dueDate: string): DueDateParts | null {
  if (!dueDate) {
    return null;
  }

  const parts = dueDate.split('/');
  if (parts.length !== 3) {
    return null;
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null;
  }

  return { day, month, year };
}

/**
 * Convert a DD/MM date string to YYYYMMDD format using the inferred year.
 */
function toOfxDate(dateDdMm: string, year: number): string {
  const [day, month] = dateDdMm.split('/');
  return `${year}${month}${day}`;
}

/**
 * Infer transaction year based on dueDate month/year.
 * If transaction month is greater than due month (year boundary), use dueYear - 1.
 * Falls back to current year when dueDate is absent or invalid.
 */
function inferTransactionYear(transactionDate: string, dueDate: string): number {
  const parsedDueDate = parseDueDateParts(dueDate);

  if (!parsedDueDate) {
    return new Date().getFullYear();
  }

  const [_, transactionMonthRaw] = transactionDate.split('/');
  const transactionMonth = parseInt(transactionMonthRaw, 10);

  if (Number.isNaN(transactionMonth)) {
    return parsedDueDate.year;
  }

  if (transactionMonth > parsedDueDate.month) {
    return parsedDueDate.year - 1;
  }

  return parsedDueDate.year;
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
      const year = inferTransactionYear(tx.date, statement.dueDate);
      const dateOfx = toOfxDate(tx.date, year);
      const fitId = generateFitId(dateOfx, i);
      const amount = (-Math.abs(tx.amount)).toFixed(2);

      return [
        '<STMTTRN>',
        '<TRNTYPE>DEBIT</TRNTYPE>',
        `<DTPOSTED>${dateOfx}</DTPOSTED>`,
        `<TRNAMT>${amount}</TRNAMT>`,
        `<FITID>${fitId}</FITID>`,
        `<MEMO>${escapeXml(tx.description)}</MEMO>`,
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
    `<ACCTID>${escapeXml(statement.cardNumber)}</ACCTID>`,
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
    `<FI><ORG>${escapeXml(statement.bankName)}</ORG></FI>`,
    '</OFX>',
  ].join('\n');

  return `${header}\n\n${body}\n`;
}
