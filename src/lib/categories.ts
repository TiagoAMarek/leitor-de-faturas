/**
 * Category detection, icons, and color mapping for transaction categories.
 */

const CATEGORY_ICONS: Record<string, string> = {
  restaurante: '🍽️',
  supermercado: '🛒',
  saúde: '💊',
  lazer: '🎬',
  vestuário: '👕',
  serviços: '✂️',
  outros: '📦',
  viagem: '✈️',
  transporte: '🚗',
  educação: '📚',
  moradia: '🏠',
  assinatura: '📺',
};

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category.toLowerCase()] || '📦';
}

const CATEGORY_COLORS: Record<string, string> = {
  restaurante: '#f43f5e',
  supermercado: '#10b981',
  saúde: '#3b82f6',
  lazer: '#f59e0b',
  vestuário: '#ec4899',
  serviços: '#06b6d4',
  outros: '#8b5cf6',
  viagem: '#f97316',
  transporte: '#6366f1',
  educação: '#14b8a6',
  moradia: '#eab308',
  assinatura: '#a855f7',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || '#8b5cf6';
}

// P1: Pre-compiled regexes for category detection — avoids re-creation per call.
const CATEGORY_RULES: { regex: RegExp; category: string }[] = [
  { regex: /farmacia|drogaria|panvel|raia|droga|saude|medic|clinic|hospital|psiq/i, category: 'saúde' },
  { regex: /supermercado|bourbon|zaffari|carrefour|big\b|nacional|atacadao/i, category: 'supermercado' },
  { regex: /market4u|market 4u/i, category: 'supermercado' },
  { regex: /restaurante|cafe|bistro|pizza|burger|mcdonald|lanchon|padaria|confeitaria|fazenda|marber|quiero|amuitoprazer|lohmann|barber/i, category: 'restaurante' },
  { regex: /cinema|cinemark|netflix|spotify|prime.*canal|paramount|teatro|show|ingresso|ipanema.*sport/i, category: 'lazer' },
  { regex: /uber|99|taxi|cabify|posto|combusti|estaciona|shell|ipiranga/i, category: 'transporte' },
  { regex: /roupa|vestuario|zara|renner|cea|riachuelo|hering|alpina.*presente/i, category: 'vestuário' },
  { regex: /amazon.*prime|prime.*aluguel|melimais|assinatura/i, category: 'assinatura' },
  { regex: /amazon|mercado.*livre|shopee|aliexpress|magalu|casas.*bahia|prata.*fina/i, category: 'outros' },
  { regex: /aluguel|condominio|energia|agua|luz|ceee|corsan/i, category: 'moradia' },
  { regex: /escola|faculdade|curso|livro|udemy/i, category: 'educação' },
  { regex: /viagem|hotel|airbnb|booking|aviao|gol\b|latam|azul\b/i, category: 'viagem' },
];

export function detectCategory(description: string): string {
  const desc = description.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.regex.test(desc)) return rule.category;
  }
  return 'outros';
}

/**
 * Infer category from Itaú's raw category hint, falling back to keyword detection.
 */
export function inferCategory(rawCategory: string, description: string): string {
  const normalized = rawCategory.trim().toLowerCase();
  if (normalized && normalized !== 'outros' && CATEGORY_COLORS[normalized]) {
    return normalized;
  }
  return detectCategory(description);
}
