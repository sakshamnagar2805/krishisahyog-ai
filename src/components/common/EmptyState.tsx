import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction, className = '' }) => (
  <div className={`flex flex-col items-center justify-center px-6 py-10 text-center ${className}`}>
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-soft text-navy mb-3">
      <Inbox className="w-6 h-6" aria-hidden="true" />
    </span>
    <h3 className="font-semibold text-navy">{title}</h3>
    <p className="text-sm text-muted max-w-sm mt-1">{description}</p>
    {actionLabel && onAction && (
      <Button variant="secondary" size="sm" className="mt-4" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);
