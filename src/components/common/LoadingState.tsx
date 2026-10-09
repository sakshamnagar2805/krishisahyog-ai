import React from 'react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading…', className = '' }) => (
  <div className={`flex flex-col items-center justify-center p-10 text-center ${className}`} role="status">
    <span className="h-9 w-9 rounded-full border-[3px] border-line border-t-brand-dark animate-spin" aria-hidden="true" />
    <p className="text-sm text-muted mt-3">{message}</p>
  </div>
);
