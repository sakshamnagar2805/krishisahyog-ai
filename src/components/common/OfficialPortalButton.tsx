import React from 'react';
import { ExternalLink } from 'lucide-react';

interface OfficialPortalButtonProps {
  href: string;
  label?: string;
  portalName?: string;
  className?: string;
}

/** Link to an official government website, opened in a new tab */
export const OfficialPortalButton: React.FC<OfficialPortalButtonProps> = ({
  href,
  label = 'Open official portal',
  portalName,
  className = '',
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center justify-center gap-2 min-h-11 rounded-md border border-line bg-white px-4 text-[15px] font-semibold text-ink hover:bg-offwhite ${className}`}
  >
    {portalName || label}
    <ExternalLink className="w-4 h-4 text-muted" aria-hidden="true" />
    <span className="sr-only">(opens in a new tab)</span>
  </a>
);
