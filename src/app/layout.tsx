import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leitor de Faturas",
  description: "Faça upload da fatura do seu cartão de crédito e visualize seus gastos de forma organizada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
