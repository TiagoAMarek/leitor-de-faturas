import { useCallback, useMemo } from 'react';
import { ParsedStatement, getCategoryIcon, getCategoryColor } from '@/lib/parser';
import { generateOfx } from '@/lib/ofx-exporter';
import { downloadTextFile } from '@/lib/file-utils';
import { UI_CONSTANTS } from '@/lib/constants';
import styles from './TransactionTimeline.module.css';

interface Props {
  statement: ParsedStatement;
}

interface GroupedByDay {
  day: string;
  transactions: ParsedStatement['transactions'];
}

function groupByDay(transactions: ParsedStatement['transactions']): GroupedByDay[] {
  const groups: Record<string, ParsedStatement['transactions']> = {};

  for (const tx of transactions) {
    const day = tx.date.split('/')[0];
    if (!groups[day]) groups[day] = [];
    groups[day].push(tx);
  }

  // Sort by day descending
  return Object.entries(groups)
    .sort(([a], [b]) => parseInt(b) - parseInt(a))
    .map(([day, transactions]) => ({ day, transactions }));
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function sanitizeFilePart(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inferYear(dueDate: string): number {
  const parts = dueDate.split('/');
  if (parts.length === 3) {
    const year = parseInt(parts[2], 10);
    if (!Number.isNaN(year)) return year;
  }
  return new Date().getFullYear();
}

function buildPeriodLabel(statement: ParsedStatement): string {
  if (statement.transactions.length === 0) return '';

  const year = inferYear(statement.dueDate);
  const months = statement.transactions
    .map((tx) => tx.date.split('/')[1])
    .map((month) => parseInt(month, 10))
    .filter((month) => !Number.isNaN(month));

  if (months.length === 0) return String(year);

  const minMonth = Math.min(...months);
  const maxMonth = Math.max(...months);
  const start = `${year}-${String(minMonth).padStart(2, '0')}`;
  if (minMonth === maxMonth) return start;
  const end = `${year}-${String(maxMonth).padStart(2, '0')}`;
  return `${start}_a_${end}`;
}

function buildOfxFilename(statement: ParsedStatement): string {
  const bankPart = sanitizeFilePart(statement.bankName || 'fatura');
  const periodPart = buildPeriodLabel(statement);
  if (!periodPart) return UI_CONSTANTS.DEFAULT_OFX_FILENAME;
  return `${bankPart}-${periodPart}.ofx`;
}

export default function TransactionTimeline({ statement }: Props) {
  const grouped = useMemo(() => groupByDay(statement.transactions), [statement.transactions]);

  const handleExportOfx = useCallback(() => {
    const content = generateOfx(statement);
    downloadTextFile(content, buildOfxFilename(statement), 'application/x-ofx');
  }, [statement]);

  // Category totals for summary
  const { categoryTotals, sortedCategories } = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const tx of statement.transactions) {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    }
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return { categoryTotals: totals, sortedCategories: sorted };
  }, [statement.transactions]);

  return (
    <div className={styles.container}>
      {/* Header card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.bankInfo}>
            <div className={styles.bankLogo}>
              <span className={styles.bankEmoji}>🏦</span>
            </div>
            <div>
              <h2 className={styles.bankName}>{statement.bankName}</h2>
              <p className={styles.cardNumber}>{statement.cardNumber}</p>
            </div>
          </div>
          <div className={styles.totalSection}>
            <span className={styles.totalLabel}>Total da fatura</span>
            <span className={styles.totalAmount}>{formatCurrency(statement.totalAmount)}</span>
          </div>
          <button className={styles.exportButton} onClick={handleExportOfx} title="Exportar OFX">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar OFX
          </button>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Titular</span>
            <span className={styles.metaValue}>{statement.cardHolder}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Vencimento</span>
            <span className={styles.metaValue}>{statement.dueDate}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Lançamentos</span>
            <span className={styles.metaValue}>{statement.transactions.length}</span>
          </div>
        </div>

        {/* Category chips */}
        <div className={styles.categoryChips}>
          {sortedCategories.map(([cat, total]) => (
            <div
              key={cat}
              className={styles.chip}
              style={{ '--chip-color': getCategoryColor(cat) } as React.CSSProperties}
            >
              <span className={styles.chipIcon}>{getCategoryIcon(cat)}</span>
              <span className={styles.chipLabel}>{cat}</span>
              <span className={styles.chipValue}>{formatCurrency(total)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        {grouped.map((group, groupIdx) => (
          <div
            key={group.day}
            className={styles.dayGroup}
            style={{ animationDelay: `${groupIdx * UI_CONSTANTS.ANIMATION_DELAY_MS}ms` }}
          >
            <div className={styles.dayLabel}>
              <span className={styles.dayNumber}>{group.day}</span>
            </div>

            <div className={styles.dayTransactions}>
              {group.transactions.map((tx, txIdx) => (
                <div
                  key={`${tx.date}-${txIdx}`}
                  className={styles.transactionRow}
                >
                  <div
                    className={styles.categoryDot}
                    style={{ background: getCategoryColor(tx.category) }}
                  >
                    <span className={styles.dotIcon}>{getCategoryIcon(tx.category)}</span>
                  </div>

                  <div className={styles.txInfo}>
                    <span className={styles.txDescription}>{tx.description}</span>
                    <span className={styles.txMeta}>
                      {tx.category}
                      {tx.city && ` • ${tx.city}`}
                      {tx.installment && (
                        <span className={styles.installmentBadge}>{tx.installment}</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.txAmount}>
                    <span className={tx.amount < 0 ? styles.amountNegative : styles.amountPositive}>
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
