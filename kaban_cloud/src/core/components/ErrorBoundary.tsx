import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon } from 'lucide-react';
import { notifyError } from '../hooks/useErrorNotification';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI. Receives the caught error and a `reset` callback that re-renders `children`. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called when a render error is caught, in addition to the persisted error log. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render/lifecycle errors thrown by anything below it in the tree
 * (a bad cardRender, a crashing detailPanelRender, etc.) so one broken
 * card doesn't take down the whole board. Wrap <Kanban /> with this (or
 * it's wrapped for you by the default export).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    notifyError(`Something went wrong: ${error.message}`, {
      error,
      retry: () => this.reset(),
    });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertOctagon size={32} className="text-red-500" />
        <p className="text-sm font-medium text-gray-800">The board hit an unexpected error.</p>
        <p className="max-w-sm text-xs text-gray-500">{error.message}</p>
        <button
          type="button"
          onClick={this.reset}
          className="rounded-md border border-kanban-border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Try again
        </button>
      </div>
    );
  }
}
