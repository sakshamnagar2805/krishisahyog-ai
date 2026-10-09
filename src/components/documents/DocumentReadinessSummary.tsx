import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Document } from '../../types';
import { Card, CardHeader } from '../ui';

interface DocumentReadinessSummaryProps {
  documents: Document[];
  onSelectFilter?: (filter: 'ALL' | 'REQUIRED' | 'AVAILABLE' | 'MISSING' | 'INVALID_EXPIRED') => void;
  activeFilter?: string;
}

/** Compact readiness overview, matching the documents card on the dashboard */
export const DocumentReadinessSummary: React.FC<DocumentReadinessSummaryProps> = ({ documents }) => {
  const total = documents.length;
  const readyCount = documents.filter((d) => d.status === 'AVAILABLE').length;
  const pendingReviewCount = documents.filter((d) => d.status === 'PENDING_REVIEW').length;
  const attentionCount = documents.filter(
    (d) => d.status === 'MISSING' || d.status === 'INVALID' || d.status === 'EXPIRED'
  ).length;
  const readyPercent = total > 0 ? Math.round((readyCount / total) * 100) : 0;

  const stats = [
    { label: 'Ready', value: readyCount, dot: 'bg-brand' },
    { label: 'Pending review', value: pendingReviewCount, dot: 'bg-warning' },
    { label: 'Needs attention', value: attentionCount, dot: 'bg-danger' },
  ];

  return (
    <Card id="document-readiness-summary">
      <CardHeader
        title="Document readiness"
        description={total > 0 ? `${readyCount} of ${total} ready` : 'No documents added yet'}
        icon={<FolderOpen className="w-5 h-5" aria-hidden="true" />}
      />
      <div className="px-5">
        <div
          className="h-2 rounded-full bg-offwhite border border-line overflow-hidden"
          role="progressbar"
          aria-valuenow={readyPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Documents ready"
        >
          <div className="h-full bg-brand transition-all duration-500" style={{ width: `${readyPercent}%` }} />
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-px bg-line border-t border-line rounded-b-lg overflow-hidden">
        {stats.map(({ label, value, dot }) => (
          <div key={label} className="bg-white px-3 sm:px-5 py-3 min-w-0">
            <dt className="flex items-start gap-1.5 text-[13px] text-muted leading-snug">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-0.5 font-display text-2xl font-semibold text-navy tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
};
