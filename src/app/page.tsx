'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import TransactionTimeline from '@/components/TransactionTimeline';
import type { ParsedStatement } from '@/lib/parser';
import styles from './page.module.css';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [statement, setStatement] = useState<ParsedStatement | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(file: File) {
    setIsLoading(true);
    setError(null);
    setStatement(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao processar o arquivo');
        return;
      }

      setStatement(data);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setStatement(null);
    setError(null);
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logoArea}>
            <div className={styles.logo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.logoIcon}>
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <h1 className={styles.title}>Leitor de Faturas</h1>
              <p className={styles.subtitle}>Envie o PDF da sua fatura e visualize seus gastos</p>
            </div>
          </div>

          {statement && (
            <button className={styles.resetButton} onClick={handleReset}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Nova fatura
            </button>
          )}
        </header>

        {/* Error */}
        {error && (
          <div className={styles.errorCard}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Upload or Results */}
        {!statement ? (
          <UploadZone onFileSelected={handleFileSelected} isLoading={isLoading} />
        ) : (
          <TransactionTimeline statement={statement} />
        )}
      </div>
    </main>
  );
}
