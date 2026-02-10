import type { ParsedStatement } from '@/lib/parser';

export function createItauMockResponse(
  overrides?: Partial<ParsedStatement>
): ParsedStatement {
  return {
    bankName: 'Itaú',
    cardHolder: 'JOÃO DA SILVA',
    cardNumber: 'XXXX XXXX XXXX 1234',
    dueDate: '15/12/2024',
    totalAmount: 1942.97,
    transactions: [
      { date: '01/11', description: 'FARMACIA PANVEL', category: 'saúde', amount: 125.50, city: 'Porto Alegre', installment: '04/06' },
      { date: '03/11', description: 'SUPERMERCADO ZAFFARI', category: 'supermercado', amount: 234.80, city: 'Porto Alegre' },
      { date: '05/11', description: 'RESTAURANTE FAZENDA', category: 'restaurante', amount: 89.90, city: 'Porto Alegre' },
      { date: '07/11', description: 'UBER TRIP', category: 'transporte', amount: 25.30, city: 'São Paulo' },
      { date: '08/11', description: 'NETFLIX', category: 'assinatura', amount: 45.90, city: 'São Paulo' },
      { date: '10/11', description: 'POSTO IPIRANGA', category: 'transporte', amount: 180.00, city: 'Porto Alegre' },
      { date: '12/11', description: 'CINEMA CINEMARK', category: 'lazer', amount: 56.00, city: 'Porto Alegre' },
      { date: '15/11', description: 'MERCADO LIVRE', category: 'outros', amount: 320.45, city: 'São Paulo' },
      { date: '18/11', description: 'AMAZON BRSAO', category: 'outros', amount: 206.33, city: 'São Paulo', installment: '03/03' },
      { date: '20/11', description: 'PADARIA CONFEITARIA', category: 'restaurante', amount: 32.50, city: 'Porto Alegre' },
      { date: '22/11', description: 'DROGA RAIA', category: 'saúde', amount: 78.90, city: 'Porto Alegre' },
      { date: '25/11', description: 'ZARA FASHION', category: 'vestuário', amount: 299.99, city: 'São Paulo' },
      { date: '28/11', description: 'UBER EATS', category: 'restaurante', amount: 67.80, city: 'Porto Alegre' },
      { date: '29/11', description: 'MARKET4U', category: 'supermercado', amount: 156.70, city: 'Porto Alegre' },
      { date: '30/11', description: 'SPOTIFY PREMIUM', category: 'assinatura', amount: 21.90, city: 'São Paulo' },
    ],
    ...overrides,
  };
}

export function createNubankMockResponse(
  overrides?: Partial<ParsedStatement>
): ParsedStatement {
  return {
    bankName: 'Nubank',
    cardHolder: '',
    cardNumber: '1234',
    dueDate: '',
    totalAmount: 1685.57,
    transactions: [
      { date: '01/11', description: 'FARMACIA PANVEL PORTO ALEGRE', category: 'saúde', amount: 125.50, city: '' },
      { date: '03/11', description: 'SUPERMERCADO ZAFFARI PORTO ALEGRE', category: 'supermercado', amount: 234.80, city: '' },
      { date: '05/11', description: 'RESTAURANTE FAZENDA PORTO ALEGRE', category: 'restaurante', amount: 89.90, city: '' },
      { date: '07/11', description: 'UBER TRIP SAO PAULO', category: 'transporte', amount: 25.30, city: '' },
      { date: '08/11', description: 'NETFLIX ASSINATURA', category: 'assinatura', amount: 45.90, city: '' },
      { date: '10/11', description: 'POSTO IPIRANGA PORTO ALEGRE', category: 'transporte', amount: 180.00, city: '' },
      { date: '12/11', description: 'CINEMA CINEMARK PORTO ALEGRE', category: 'lazer', amount: 56.00, city: '' },
      { date: '15/11', description: 'MERCADO LIVRE SAO PAULO', category: 'outros', amount: 320.45, city: '' },
      { date: '18/11', description: 'AMAZON BRASIL SAO PAULO', category: 'outros', amount: 206.33, city: '' },
      { date: '20/11', description: 'PADARIA CONFEITARIA PORTO ALEGRE', category: 'restaurante', amount: 32.50, city: '' },
      { date: '22/11', description: 'DROGA RAIA PORTO ALEGRE', category: 'saúde', amount: 78.90, city: '' },
      { date: '25/11', description: 'ZARA FASHION SAO PAULO', category: 'vestuário', amount: 299.99, city: '' },
    ],
    ...overrides,
  };
}

/**
 * Create a mock fetch Response that resolves with given data.
 */
export function mockFetchSuccess(data: ParsedStatement) {
  return {
    ok: true,
    json: async () => data,
  };
}

/**
 * Create a mock fetch Response that returns an error.
 */
export function mockFetchError(status: number, error: string) {
  return {
    ok: false,
    status,
    json: async () => ({ error }),
  };
}
