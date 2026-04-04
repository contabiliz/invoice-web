import { FileText, FileImage, File } from 'lucide-react';

interface FileTypeIconProps {
  mimeType: string;
  size?: number;
}

export function FileTypeIcon({ mimeType, size = 20 }: FileTypeIconProps) {
  if (mimeType === 'application/xml' || mimeType === 'text/xml') {
    return <FileText size={size} className="text-text-secondary shrink-0" aria-hidden="true" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText size={size} className="text-status-error shrink-0" aria-hidden="true" />;
  }
  if (mimeType.startsWith('image/')) {
    return <FileImage size={size} className="text-text-secondary shrink-0" aria-hidden="true" />;
  }
  return <File size={size} className="text-text-disabled shrink-0" aria-hidden="true" />;
}
