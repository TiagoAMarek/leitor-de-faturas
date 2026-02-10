import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { generateOfx } from '@/lib/ofx-exporter';
import type { ParsedStatement } from '@/lib/parser';

function createMinimalStatement(overrides?: Partial<ParsedStatement>): ParsedStatement {
  return {
    bankName: 'Itaú',
    cardHolder: 'JOÃO DA SILVA',
    cardNumber: 'XXXX XXXX XXXX 1234',
    dueDate: '15/12/2024',
    totalAmount: 350.40,
    transactions: [
      { date: '01/11', description: 'FARMACIA PANVEL', category: 'saúde', amount: 125.50, city: 'Porto Alegre' },
      { date: '05/11', description: 'RESTAURANTE FAZENDA', category: 'restaurante', amount: 89.90, city: 'Porto Alegre' },
      { date: '18/11', description: 'AMAZON BRSAO', category: 'outros', amount: 135.00, city: 'São Paulo', installment: '03/03' },
    ],
    ...overrides,
  };
}

describe('generateOfx', () => {
  it('should generate valid OFX with header and envelope', () => {
    const statement = createMinimalStatement();
    const ofx = generateOfx(statement);

    // Header
    expect(ofx).toContain('OFXHEADER:100');
    expect(ofx).toContain('VERSION:102');
    expect(ofx).toContain('ENCODING:UTF-8');

    // Envelope
    expect(ofx).toContain('<OFX>');
    expect(ofx).toContain('</OFX>');
    expect(ofx).toContain('<CREDITCARDMSGSRSV1>');
    expect(ofx).toContain('<CCSTMTTRNRS>');
    expect(ofx).toContain('<CURDEF>BRL</CURDEF>');
    expect(ofx).toContain('<LANGUAGE>POR</LANGUAGE>');
  });

  it('should convert DD/MM dates to YYYYMMDD using year from dueDate', () => {
    const statement = createMinimalStatement({ dueDate: '15/12/2024' });
    const ofx = generateOfx(statement);

    expect(ofx).toContain('<DTPOSTED>20241101</DTPOSTED>');
    expect(ofx).toContain('<DTPOSTED>20241105</DTPOSTED>');
    expect(ofx).toContain('<DTPOSTED>20241118</DTPOSTED>');
  });

  it('should export amounts as negative values', () => {
    const statement = createMinimalStatement();
    const ofx = generateOfx(statement);

    expect(ofx).toContain('<TRNAMT>-125.50</TRNAMT>');
    expect(ofx).toContain('<TRNAMT>-89.90</TRNAMT>');
    expect(ofx).toContain('<TRNAMT>-135.00</TRNAMT>');
  });

  it('should include bankName as ORG and cardNumber as ACCTID', () => {
    const statement = createMinimalStatement({
      bankName: 'Nubank',
      cardNumber: '9876',
    });
    const ofx = generateOfx(statement);

    expect(ofx).toContain('<ORG>Nubank</ORG>');
    expect(ofx).toContain('<ACCTID>9876</ACCTID>');
  });

  it('should generate unique FITID per transaction', () => {
    const statement = createMinimalStatement();
    const ofx = generateOfx(statement);

    // FITIDs are date + zero-padded index
    expect(ofx).toContain('<FITID>202411010000</FITID>');
    expect(ofx).toContain('<FITID>202411050001</FITID>');
    expect(ofx).toContain('<FITID>202411180002</FITID>');
  });

  it('should include transaction descriptions as MEMO', () => {
    const statement = createMinimalStatement();
    const ofx = generateOfx(statement);

    expect(ofx).toContain('<MEMO>FARMACIA PANVEL</MEMO>');
    expect(ofx).toContain('<MEMO>RESTAURANTE FAZENDA</MEMO>');
    expect(ofx).toContain('<MEMO>AMAZON BRSAO</MEMO>');
  });

  it('should include BALAMT with negative totalAmount', () => {
    const statement = createMinimalStatement({ totalAmount: 1942.97 });
    const ofx = generateOfx(statement);

    expect(ofx).toContain('<BALAMT>-1942.97</BALAMT>');
  });

  it('should use current year when dueDate is empty', () => {
    const currentYear = new Date().getFullYear();
    const statement = createMinimalStatement({ dueDate: '' });
    const ofx = generateOfx(statement);

    expect(ofx).toContain(`<DTPOSTED>${currentYear}1101</DTPOSTED>`);
  });

  it('should mark all transactions as DEBIT', () => {
    const statement = createMinimalStatement();
    const ofx = generateOfx(statement);

    const debitCount = (ofx.match(/<TRNTYPE>DEBIT<\/TRNTYPE>/g) || []).length;
    expect(debitCount).toBe(statement.transactions.length);
  });

  it('should handle statement with no transactions', () => {
    const statement = createMinimalStatement({ transactions: [] });
    const ofx = generateOfx(statement);

    expect(ofx).toContain('<BANKTRANLIST>');
    expect(ofx).toContain('</BANKTRANLIST>');
    expect(ofx).not.toContain('<STMTTRN>');
  });
});
