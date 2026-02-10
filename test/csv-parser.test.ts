import { describe, expect, it } from 'vitest';
import { parseCsvStatement } from '@/lib/parser';
import { loadFixture } from './helpers/file-helpers';

describe('parseCsvStatement', () => {
  it('parses CSV transactions with header', () => {
    const csv = loadFixture('itau-statement.csv');
    const statement = parseCsvStatement(csv);

    expect(statement.bankName).toBe('CSV');
    expect(statement.transactions.length).toBe(35);

    expect(statement.transactions[0]).toMatchObject({
      date: '09/02',
      amount: 21.99,
    });

    const panvel = statement.transactions.find((tx) => tx.description.includes('PANVEL'));
    expect(panvel?.category).toBe('saúde');
  });

  it('ignores payment rows', () => {
    const csv = loadFixture('itau-statement.csv');
    const statement = parseCsvStatement(csv);

    const hasPayment = statement.transactions.some((tx) =>
      tx.description.toLowerCase().includes('pagamento')
    );

    expect(hasPayment).toBe(false);
  });
});
