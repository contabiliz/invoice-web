import type { Metadata } from 'next';
import { UploadView } from '@/components/upload';

export const metadata: Metadata = {
  title: 'Upload de documentos — Contabiliz',
};

export default function UploadPage() {
  return <UploadView />;
}
