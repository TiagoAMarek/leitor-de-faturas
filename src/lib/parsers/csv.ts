import type { ParsedStatement, Transaction } from '../types';
import { detectCategory } from '../categories';
import { cleanDescription } from '../utils';
import { CSV_IGNORED_DESCRIPTIONS, CSV_REQUIRED_HEADERS } from '../constants';

const DATE_DASH_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_SLASH_PATTERN = /^\d{2}\/\d{2}(\/\d{4})?$/;

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeHeader(header: string): string {
  return stripAccents(header).toLowerCase().trim();
}

function parseCsvAmount(value: string): number | null {
  const cleaned = value.replace(/[R$\s]/g, '');
  if (!cleaned) return null;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalized = cleaned;

  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.');
  }

  const num = parseFloat(normalized);
  return Number.isNaN(num) ? null : num;
}

function formatDate(raw: string): string {
  const trimmed = raw.trim();
  if (DATE_DASH_PATTERN.test(trimmed)) {
    const [year, month, day] = trimmed.split('-');
    return `${day}/${month}`;
  }
  if (DATE_SLASH_PATTERN.test(trimmed)) {
    const [day, month] = trimmed.split('/');
    return `${day}/${month}`;
  }
  return trimmed;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((value) => value.trim());
}

/**
 * Parse a CSV statement into a ParsedStatement.
 * Expects a header with data, lancamento, valor columns.
 */
export function parseCsvStatement(text: string): ParsedStatement {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      bankName: 'CSV',
      cardHolder: '',
      cardNumber: '',
      dueDate: '',
      totalAmount: 0,
      transactions: [],
    };
  }

  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';
  const headers = splitCsvLine(headerLine, delimiter).map(normalizeHeader);

  const dateIndex = headers.indexOf(CSV_REQUIRED_HEADERS[0]);
  const descriptionIndex = headers.indexOf(CSV_REQUIRED_HEADERS[1]);
  const amountIndex = headers.indexOf(CSV_REQUIRED_HEADERS[2]);

  if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
    return {
      bankName: 'CSV',
      cardHolder: '',
      cardNumber: '',
      dueDate: '',
      totalAmount: 0,
      transactions: [],
    };
  }

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i], delimiter);
    if (row.length < headers.length) continue;

    const rawDate = row[dateIndex] || '';
    const rawDescription = row[descriptionIndex] || '';
    const rawAmount = row[amountIndex] || '';

    if (!rawDate || !rawDescription || !rawAmount) continue;

    const normalizedDescription = stripAccents(rawDescription).toLowerCase();
    if (CSV_IGNORED_DESCRIPTIONS.some((desc) => normalizedDescription.includes(desc))) {
      continue;
    }

    const amount = parseCsvAmount(rawAmount);
    if (amount === null) continue;

    const description = cleanDescription(rawDescription);
    const category = detectCategory(description);

    transactions.push({
      date: formatDate(rawDate),
      description,
      category,
      amount: Math.abs(amount),
      city: '',
    });
  }

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return {
    bankName: 'CSV',
    cardHolder: '',
    cardNumber: '',
    dueDate: '',
    totalAmount,
    transactions,
  };
}
