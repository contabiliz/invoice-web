'use client';

import { useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { DocumentTab } from '@/lib/api/batch-status-client';
import { useDocumentList } from '@/hooks/useDocumentList';
import { DocumentTable } from './DocumentTable';
import { TablePagination } from './TablePagination';

interface DocumentTabsProps {
  batchId: string;
  activeTab: DocumentTab;
  onTabChange: (tab: DocumentTab) => void;
  counts: { completed: number; processing: number; failed: number; total: number };
  page: number;
  onPageChange: (page: number) => void;
}

const TABS: Array<{ key: DocumentTab; labelKey: string; countKey?: keyof DocumentTabsProps['counts'] }> = [
  { key: 'all',        labelKey: 'tabs.all',        countKey: 'total' },
  { key: 'completed',  labelKey: 'tabs.completed',  countKey: 'completed' },
  { key: 'processing', labelKey: 'tabs.processing',  countKey: 'processing' },
  { key: 'failed',     labelKey: 'tabs.failed',     countKey: 'failed' },
];

const PAGE_SIZE = 50;

export function DocumentTabs({
  batchId,
  activeTab,
  onTabChange,
  counts,
  page,
  onPageChange,
}: DocumentTabsProps) {
  const t = useTranslations('batch-status');
  const tabListRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useDocumentList(batchId, {
    tab: activeTab,
    page,
    pageSize: PAGE_SIZE,
  });

  // Keyboard navigation entre tabs (arrow keys)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      const tabButtons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      if (!tabButtons) return;

      let nextIndex = currentIndex;
      if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length;
      if (e.key === 'ArrowLeft')  nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;

      if (nextIndex !== currentIndex) {
        e.preventDefault();
        tabButtons[nextIndex]?.focus();
        onTabChange(TABS[nextIndex].key);
        onPageChange(1);
      }
    },
    [onTabChange, onPageChange],
  );

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden">
      {/* Tab list */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Filtrar documentos por status"
        className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]"
      >
        {TABS.map(({ key, labelKey, countKey }, index) => {
          const isActive = activeTab === key;
          const count = countKey ? counts[countKey] : undefined;
          const isFailed = key === 'failed' && counts.failed > 0;

          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                onTabChange(key);
                onPageChange(1);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)] ${
                isActive
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-bg-surface)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]'
              }`}
            >
              {t(labelKey)}
              {count !== undefined && (
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-xs font-semibold ${
                    isFailed
                      ? 'bg-[var(--color-status-error)] text-white'
                      : isActive
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                        : 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="p-1"
      >
        <DocumentTable
          items={data?.items ?? []}
          isLoading={isLoading}
          total={data?.total ?? 0}
        />

        <div className="px-2 pb-2">
          <TablePagination
            currentPage={page}
            totalItems={data?.total ?? 0}
            pageSize={PAGE_SIZE}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
}
