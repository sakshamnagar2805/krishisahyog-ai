import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';

interface SourceVerificationCardProps {
  authority: string;
  documentTitle: string;
  clauseReference?: string;
  officialGazetteUrl?: string;
  sha256Checksum?: string;
  lastVerified?: string;
  className?: string;
}

/** Where a piece of guidance comes from */
export const SourceVerificationCard: React.FC<SourceVerificationCardProps> = ({
  authority,
  documentTitle,
  clauseReference,
  officialGazetteUrl,
  lastVerified,
  className = '',
}) => (
  <div className={`rounded-lg border border-line bg-offwhite p-4 ${className}`}>
    <div className="flex items-center gap-2 text-sm font-semibold text-navy">
      <BookOpen className="w-4 h-4 text-muted" aria-hidden="true" /> Source
    </div>
    <p className="mt-2 text-[15px] text-ink">
      {documentTitle}
      {clauseReference && <span className="text-muted"> · {clauseReference}</span>}
    </p>
    <p className="text-sm text-muted mt-0.5">{authority}</p>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
      {lastVerified && <span>Checked {lastVerified}</span>}
      {officialGazetteUrl && (
        <a
          href={officialGazetteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-brand-dark hover:underline underline-offset-4"
        >
          Official document <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  </div>
);
