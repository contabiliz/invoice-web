import { FileCode2, FileText, Image } from 'lucide-react';
import type { DocumentDocType } from '@/lib/api/types';

interface DocTypeIconProps {
  docType: DocumentDocType;
}

const ICON_MAP = {
  xml: FileCode2,
  pdf: FileText,
  img: Image,
} as const;

// Server Component — ícone estático por tipo de documento
export function DocTypeIcon({ docType }: DocTypeIconProps) {
  const Icon = ICON_MAP[docType] ?? FileText;
  return <Icon size={16} className="text-[var(--color-text-secondary)] shrink-0" />;
}
