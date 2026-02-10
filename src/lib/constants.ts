/**
 * Application-wide constants to avoid magic numbers and strings.
 */

// File validation constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const SUPPORTED_FILE_EXTENSIONS = ['.pdf', '.ofx'] as const;
export const SUPPORTED_MIME_TYPES = {
  pdf: ['application/pdf'] as readonly string[],
  ofx: ['text/ofx', 'application/x-ofx'] as readonly string[],
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `Arquivo muito grande. O limite é ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
  NO_FILE_UPLOADED: 'Nenhum arquivo enviado',
  INVALID_FILE_FORMAT: 'Formato inválido. Envie um arquivo PDF ou OFX.',
  EMPTY_FILE_CONTENT: 'Não foi possível extrair o conteúdo do arquivo.',
  NO_TRANSACTIONS_FOUND: 'Nenhum lançamento encontrado no arquivo. Verifique se é uma fatura ou extrato válido.',
  PROCESSING_ERROR: 'Erro ao processar o arquivo. Tente novamente.',
  CONNECTION_ERROR: 'Erro de conexão. Tente novamente.',
} as const;

// OFX Parser constants
export const OFX_IGNORED_MEMOS = [
  'Pagamento recebido',
  'Crédito de atraso',
  'Saldo em atraso',
  'Ajuste a crédito',
  'Encerramento de dívida',
  'Encargos',
] as const;

export const OFX_DATE_INDICES = {
  DAY_START: 6,
  DAY_END: 8,
  MONTH_START: 4,
  MONTH_END: 6,
} as const;

// Itaú Parser constants
export const ITAU_LABELS = {
  // Metadata extraction
  CARD_PREFIX: 'Cartão',
  DUE_DATE_PREFIX: 'Vencimento:',
  CARD_HOLDER_PREFIX: 'Titular',
  TOTAL_LABEL: 'Total desta fatura',
  TOTAL_LABEL_ALT: 'O total da sua fatura é:',
  // Table headers
  TABLE_HEADER_1: 'DATA ESTABELECIMENTO VALOR EM R$',
  TABLE_HEADER_2: 'DATA VALOR EM R$',
} as const;

// Itaú transaction section markers
export const ITAU_TRANSACTION_START_MARKERS = [
  'Lançamentos:',
  'Lançamentos no cartão',
] as const;

export const ITAU_TRANSACTION_END_MARKERS = [
  'Total dos lançamentos',
  'Caso você pague',
] as const;

// Itaú nextLine detection prefixes (used to skip non-transaction lines)
export const ITAU_NEXTLINE_SKIP_PREFIXES = [
  'Lançamentos', // Matches transaction headers
  'Total', // Matches total/summary lines
  'Caso', // Matches payment info lines
] as const;

export const ITAU_PATTERNS = {
  TRANSACTION_LINE: /^(\d{2}\/\d{2})\s+(.+?)\s+([\d.,]+)$/,
  INSTALLMENT_IN_DESC: /\s+(\d{2}\/\d{2})$/,
  DATE_PREFIX: /^\d{2}\/\d{2}\s/,
} as const;

// Bank detection constants
export const BANK_DETECTION = {
  OFX_MARKERS: ['<OFX>', 'OFXHEADER'],
  ITAU_MARKERS: ['Itaú', 'itau', 'ITAÚ', 'Cartões'],
} as const;

// UI constants
export const UI_CONSTANTS = {
  ANIMATION_DELAY_MS: 60,
  DEFAULT_OFX_FILENAME: 'fatura.ofx',
} as const;
