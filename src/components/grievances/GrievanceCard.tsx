import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Grievance } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface GrievanceCardProps {
  grievance: Grievance;
  onSelect: (grievanceId: string) => void;
}

const FINISHED_STATUSES: Grievance['status'][] = ['RESOLVED', 'REJECTED', 'CLOSED'];

export const GrievanceCard: React.FC<GrievanceCardProps> = ({ grievance, onSelect }) => {
  const displayId = grievance.grievanceId || grievance.ticketId || grievance.id;
  const filedOn = grievance.lodgedDate || new Date(grievance.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const showDaysLeft =
    grievance.slaDaysRemaining !== undefined && !FINISHED_STATUSES.includes(grievance.status);
  const attachmentCount = grievance.attachments?.length ?? 0;

  return (
    <div id={`grievance-card-${grievance.id}`}>
      <button
        type="button"
        onClick={() => onSelect(grievance.id)}
        className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-offwhite"
        id={`view-grievance-btn-${grievance.id}`}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusBadge status={grievance.status} />
            <span className="text-[13px] text-muted tabular-nums">{displayId}</span>
          </span>
          <span className="mt-1.5 block font-semibold text-navy leading-snug">{grievance.subject}</span>
          <span className="mt-0.5 block text-sm text-muted">
            {grievance.category} · Filed <span className="tabular-nums">{filedOn}</span>
            {showDaysLeft && (
              <>
                {' '}
                · <span className="tabular-nums">{grievance.slaDaysRemaining}</span>{' '}
                {grievance.slaDaysRemaining === 1 ? 'day' : 'days'} left for a response
              </>
            )}
          </span>
          {(grievance.relatedClaimId || attachmentCount > 0) && (
            <span className="mt-0.5 block text-[13px] text-muted">
              {grievance.relatedClaimId && (
                <>
                  Claim <span className="tabular-nums">{grievance.relatedClaimId}</span>
                </>
              )}
              {grievance.relatedClaimId && attachmentCount > 0 && ' · '}
              {attachmentCount > 0 && `${attachmentCount} ${attachmentCount === 1 ? 'attachment' : 'attachments'}`}
            </span>
          )}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted group-hover:text-navy" aria-hidden="true" />
        <span className="sr-only">View details</span>
      </button>
    </div>
  );
};
