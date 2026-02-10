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
