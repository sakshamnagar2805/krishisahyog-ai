import React from 'react';
import { RotateCw } from 'lucide-react';
import { Notice } from '../ui/Notice';
import { Button } from '../ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We could not load this information. Please try again.',
  onRetry,
  className = '',
}) => (
  <Notice
    tone="danger"
    title={title}
    className={className}
    action={
      onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCw className="w-4 h-4" aria-hidden="true" /> Try again
        </Button>
      )
    }
  >
    {message}
  </Notice>
);
