import React from 'react';
import { VerificationStatus, PMFBYClaimStatus, GrievanceStatus } from '../../types';

type BadgeStatus =
  | VerificationStatus
  | PMFBYClaimStatus
  | GrievanceStatus
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'PENDING_REVIEW'
  | 'NOT_REQUIRED'
  | 'ACTIVE'
  | 'UNDER_INQUIRY'
  | 'AVAILABLE'
  | 'MISSING'
  | 'INVALID'
  | 'INVALID / EXPIRED';

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
  label?: string;
}

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONES: Record<Tone, { badge: string; dot: string }> = {
  success: { badge: 'bg-brand-light text-brand-dark', dot: 'bg-brand' },
  warning: { badge: 'bg-warning/15 text-ink', dot: 'bg-warning' },
  danger: { badge: 'bg-danger/10 text-danger', dot: 'bg-danger' },
  info: { badge: 'bg-blue-soft text-navy', dot: 'bg-navy/60' },
  neutral: { badge: 'bg-offwhite text-muted border border-line', dot: 'bg-muted' },
};

const STATUS_STYLE: Partial<Record<BadgeStatus, { tone: Tone; label: string }>> = {
  SUBMITTED: { tone: 'info', label: 'Submitted' },
  ACKNOWLEDGED: { tone: 'info', label: 'Acknowledged' },
  FORWARDED: { tone: 'info', label: 'Forwarded' },
  'UNDER REVIEW': { tone: 'warning', label: 'Under review' },
  IN_REVIEW: { tone: 'warning', label: 'In review' },
  PENDING_REVIEW: { tone: 'warning', label: 'Pending review' },
  IN_PROGRESS: { tone: 'warning', label: 'In progress' },
  UNDER_INQUIRY: { tone: 'warning', label: 'Under inquiry' },
  PENDING: { tone: 'warning', label: 'Pending' },
  'ADDITIONAL INFORMATION REQUIRED': { tone: 'danger', label: 'Information required' },
  ACTION_REQUIRED: { tone: 'danger', label: 'Action required' },
  MISSING: { tone: 'danger', label: 'Missing' },
  REJECTED: { tone: 'danger', label: 'Rejected' },
  EXPIRED: { tone: 'danger', label: 'Expired' },
  INVALID: { tone: 'danger', label: 'Invalid' },
  'INVALID / EXPIRED': { tone: 'danger', label: 'Invalid or expired' },
  RESOLVED: { tone: 'success', label: 'Resolved' },
  VERIFIED: { tone: 'success', label: 'Verified' },
  COMPLETED: { tone: 'success', label: 'Completed' },
  AVAILABLE: { tone: 'success', label: 'Available' },
  ACTIVE: { tone: 'success', label: 'Active' },
  CLOSED: { tone: 'neutral', label: 'Closed' },
  NOT_REQUIRED: { tone: 'neutral', label: 'Not required' },
  DEMO: { tone: 'neutral', label: 'Demo' },
};

/** Labels passed in capitals ("INVALID / EXPIRED") are shown in sentence case */
const toSentenceCase = (text: string) =>
  /^[A-Z0-9 _/&•-]+$/.test(text)
    ? text.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
    : text;

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', label }) => {
  const style = STATUS_STYLE[status] ?? { tone: 'neutral' as Tone, label: toSentenceCase(status) };
  const tone = TONES[style.tone];
  const displayLabel = label ? toSentenceCase(label) : style.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium whitespace-nowrap ${tone.badge} ${className}`}
      role="status"
      aria-label={`Status: ${displayLabel}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      {displayLabel}
    </span>
  );
};
