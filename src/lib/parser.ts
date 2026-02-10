export interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  city: string;
  installment?: string;
}

export interface ParsedStatement {
  bankName: string;
  cardHolder: string;
  cardNumber: string;
  dueDate: string;
  totalAmount: number;
  transactions: Transaction[];
}

const CATEGORY_ICONS: Record<string, string> = {
  restaurante: "🍽️",
  supermercado: "🛒",
  saúde: "💊",
  lazer: "🎬",
  vestuário: "👕",
  serviços: "✂️",
  outros: "📦",
  viagem: "✈️",
  transporte: "🚗",
  educação: "📚",
  moradia: "🏠",
  assinatura: "📺",
};

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category.toLowerCase()] || "📦";
}

const CATEGORY_COLORS: Record<string, string> = {
  restaurante: "#f43f5e",
  supermercado: "#10b981",
  saúde: "#3b82f6",
  lazer: "#f59e0b",
  vestuário: "#ec4899",
  serviços: "#06b6d4",
  outros: "#8b5cf6",
  viagem: "#f97316",
  transporte: "#6366f1",
  educação: "#14b8a6",
  moradia: "#eab308",
  assinatura: "#a855f7",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || "#8b5cf6";
}

function detectCategory(description: string): string {
  const desc = description.toLowerCase();

  if (
    /farmacia|drogaria|panvel|raia|droga|saude|medic|clinic|hospital|psiq/i.test(
      desc,
    )
  )
    return "saúde";
  if (
    /supermercado|bourbon|zaffari|carrefour|big\b|nacional|atacadao/i.test(desc)
  )
    return "supermercado";
  if (/market4u|market 4u/i.test(desc)) return "supermercado";
  if (
    /restaurante|cafe|bistro|pizza|burger|mcdonald|lanchon|padaria|confeitaria|fazenda|marber|quiero|amuitoprazer|lohmann|barber/i.test(
      desc,
    )
  )
    return "restaurante";
  if (
    /cinema|cinemark|netflix|spotify|prime.*canal|paramount|teatro|show|ingresso|ipanema.*sport/i.test(
      desc,
    )
  )
    return "lazer";
  if (/uber|99|taxi|cabify|posto|combusti|estaciona|shell|ipiranga/i.test(desc))
    return "transporte";
  if (
    /roupa|vestuario|zara|renner|cea|riachuelo|hering|alpina.*presente/i.test(
      desc,
    )
  )
    return "vestuário";
  if (/amazon.*prime|prime.*aluguel|melimais|assinatura/i.test(desc))
    return "assinatura";
  if (
    /amazon|mercado.*livre|shopee|aliexpress|magalu|casas.*bahia|prata.*fina/i.test(
      desc,
    )
  )
    return "outros";
  if (/aluguel|condominio|energia|agua|luz|ceee|corsan/i.test(desc))
    return "moradia";
  if (/escola|faculdade|curso|livro|udemy/i.test(desc)) return "educação";
  if (/viagem|hotel|airbnb|booking|aviao|gol\b|latam|azul\b/i.test(desc))
    return "viagem";

  return "outros";
}

function inferCategory(rawCategory: string, description: string): string {
  // Itaú sometimes provides a category hint on the next line
  const normalized = rawCategory.trim().toLowerCase();
  if (normalized && normalized !== "outros" && CATEGORY_COLORS[normalized]) {
    return normalized;
  }
  // Fall back to keyword-based detection
  return detectCategory(description);
}

export function parseItauStatement(text: string): ParsedStatement {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract metadata
  let cardHolder = "";
  let cardNumber = "";
  let dueDate = "";
  let totalAmount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("Cartão") && line.includes("XXXX")) {
      cardNumber = line.replace("Cartão", "").trim();
    }
    if (line.startsWith("Vencimento:")) {
      dueDate = line.replace("Vencimento:", "").trim();
    }
    if (line.startsWith("Titular")) {
      cardHolder = line.replace("Titular", "").trim();
    }
    if (line === "Total desta fatura") {
      const nextLine = lines[i + 1];
      if (nextLine) {
        const val = parseAmount(nextLine);
        if (val !== null) totalAmount = val;
      }
    }
    if (line.startsWith("O total da sua fatura é:")) {
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
      line.startsWith("Total dos lançamentos") ||
      line.startsWith("Caso você pague")
    ) {
      inTransactionSection = false;
      continue;
    }

    if (!inTransactionSection) continue;

    // Skip headers
    if (
      line === "DATA ESTABELECIMENTO VALOR EM R$" ||
      line === "DATA VALOR EM R$"
    )
      continue;

    // Match transaction line: DD/MM DESCRIPTION VALUE
    // Format: "13/11 AMAZON BRSAO P 03/03 206,33"
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
        description = description.replace(/\s+\d{2}\/\d{2}$/, "").trim();
      }

      // Next line might be category + city
      let category = "outros";
      let city = "";
      const nextLine = lines[i + 1];
      if (
        nextLine &&
        !/^\d{2}\/\d{2}\s/.test(nextLine) &&
        !nextLine.startsWith("Lançamentos") &&
        !nextLine.startsWith("Total") &&
        !nextLine.startsWith("Caso")
      ) {
        const parts = nextLine.split(/\s{2,}/);
        const rawCat = parts[0] || "";
        city = parts[1] || parts[0] || "";
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
    bankName: "Itaú",
    cardHolder,
    cardNumber,
    dueDate,
    totalAmount,
    transactions,
  };
}

function cleanDescription(desc: string): string {
  // Remove city codes stuck at the end like "PORTO ALEGREBR", "SAO PAULOB"
  return desc
    .replace(/BR$/, "")
    .replace(/([A-Z])B$/, "$1")
    .replace(/([A-Z])P$/, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCity(city: string): string {
  if (!city) return "";
  return city
    .replace(/BR$/, "")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

function parseAmount(str: string): number | null {
  const cleaned = str
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Generic parser entry point.
 * Detects bank from text content and delegates to the appropriate parser.
 */
export function parseStatement(text: string): ParsedStatement {
  // For now, we only support Itaú format
  // The parser is heuristic and tries to handle common patterns
  if (
    text.includes("Itaú") ||
    text.includes("itau") ||
    text.includes("ITAÚ") ||
    text.includes("Cartões")
  ) {
    return parseItauStatement(text);
  }

  // Fallback: try Itaú parser anyway (most common format)
  return parseItauStatement(text);
}
