import React from 'react';
import { BookOpen } from 'lucide-react';
import { StatusBadge } from '../common';

export interface SourceVerificationCardProps {
  authority?: string;
  source?: string;
  document?: string;
  section?: string;
  version?: string;
  lastVerified?: string;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN' | 'DEMO' | string;
}

/** Status shown for the source. Sample records are never labelled as verified. */
const STATUS_DISPLAY: Record<string, { status: 'DEMO' | 'CLOSED' | 'ACTIVE'; label: string }> = {
  DEMO: { status: 'DEMO', label: 'Sample data' },
  VERIFIED: { status: 'ACTIVE', label: 'Source listed' },
  UNVERIFIED: { status: 'CLOSED', label: 'Not checked' },
  UNKNOWN: { status: 'CLOSED', label: 'Not known' },
};

/** Where the rule behind a document requirement comes from */
export const SourceVerificationCard: React.FC<SourceVerificationCardProps> = ({
  authority,
  source,
  document,
  section,
  version,
  lastVerified,
  verificationStatus = 'VERIFIED',
}) => {
  if (!authority && !source && !document) {
    return (
      <div className="rounded-lg border border-line bg-offwhite p-4 text-sm text-muted">
        No source details are available for this document.
      </div>
    );
  }

  const display = STATUS_DISPLAY[verificationStatus] ?? STATUS_DISPLAY.UNKNOWN;

  const facts = [
    { label: 'Authority', value: authority },
    { label: 'Document', value: document },
    { label: 'Section', value: section },
    { label: 'Version', value: version },
    { label: 'Last checked', value: lastVerified },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <div className="rounded-lg border border-line bg-offwhite p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-navy">
          <BookOpen className="w-4 h-4 text-muted" aria-hidden="true" /> Source
        </span>
        <StatusBadge status={display.status} label={display.label} />
      </div>

      {facts.length > 0 && (
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {facts.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-[13px] text-muted">{label}</dt>
              <dd className={`text-[15px] text-ink break-words ${label === 'Last checked' ? 'tabular-nums' : ''}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};
