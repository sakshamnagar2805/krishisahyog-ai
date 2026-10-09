import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<NoticeTone, { box: string; icon: React.ReactNode }> = {
  info: { box: 'bg-blue-soft border-navy/60', icon: <Info className="w-5 h-5 text-navy" /> },
  success: { box: 'bg-brand-light/60 border-brand-dark', icon: <CheckCircle2 className="w-5 h-5 text-brand-dark" /> },
  warning: { box: 'bg-warning/10 border-warning', icon: <AlertTriangle className="w-5 h-5 text-ink" /> },
  danger: { box: 'bg-danger/5 border-danger', icon: <XCircle className="w-5 h-5 text-danger" /> },
};

interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** Inline callout with a coloured left edge */
export const Notice: React.FC<NoticeProps> = ({ tone = 'info', title, children, action, className = '' }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-start gap-3 border-l-4 rounded-r-md px-4 py-3 ${TONES[tone].box} ${className}`}
    role={tone === 'danger' || tone === 'warning' ? 'alert' : 'note'}
  >
    <span className="shrink-0 mt-0.5" aria-hidden="true">
      {TONES[tone].icon}
    </span>
    <div className="flex-1 min-w-0 text-[15px] text-ink leading-relaxed">
      {title && <p className="font-semibold text-navy">{title}</p>}
      {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
