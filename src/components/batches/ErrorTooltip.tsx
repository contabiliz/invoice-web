'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface ErrorTooltipProps {
  mappedReason: string;    // mensagem PT-BR exibida na célula (truncada)
  technicalReason: string; // error_reason raw exibido no tooltip
}

/**
 * Tooltip acessível via hover e foco de teclado.
 * PRD §03.9 — acessível via teclado (foco + Enter).
 */
export function ErrorTooltip({ mappedReason, technicalReason }: ErrorTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <span className="truncate max-w-[200px] text-[var(--color-text-primary)]" title={mappedReason}>
        {mappedReason}
      </span>

      <span className="relative inline-flex shrink-0">
        <button
          type="button"
          aria-label="Razão técnica completa"
          aria-expanded={open}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <HelpCircle size={13} />
        </button>

        {open && (
          <span
            role="tooltip"
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-max max-w-xs rounded bg-[var(--color-text-primary)] px-2.5 py-1.5 text-xs text-[var(--color-bg-surface)] shadow-lg whitespace-pre-wrap"
          >
            {technicalReason}
          </span>
        )}
      </span>
    </span>
  );
}
