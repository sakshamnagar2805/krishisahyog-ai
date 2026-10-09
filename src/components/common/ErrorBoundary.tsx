import React from 'react';
import { ErrorState } from './ErrorState';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
  resetLabel?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render errors in a subtree so a single broken page
 * does not unmount the whole kiosk application.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Page render failed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const { onReset, resetLabel = 'Return to Dashboard' } = this.props;

    return (
      <div className="space-y-3">
        <ErrorState
          title="This page could not be displayed"
          message="An unexpected error occurred while rendering this section. Other sections remain available."
        />
        <button
          onClick={() => (onReset ? onReset() : window.location.reload())}
          className="inline-flex items-center min-h-11 px-4 rounded-md bg-brand-dark hover:bg-brand-dark/90 text-white text-[15px] font-semibold"
        >
          {onReset ? resetLabel : 'Reload Application'}
        </button>
      </div>
    );
  }
}
