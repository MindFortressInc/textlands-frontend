"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console in development, could send to error tracking service
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--void)] p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="text-[var(--crimson)] text-4xl">!</div>
            <div className="text-[var(--amber)] font-bold tracking-[0.3em] text-lg">
              SOMETHING WENT WRONG
            </div>
            <p className="text-[var(--text-dim)] text-sm">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--amber)] hover:border-[var(--amber)] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--mist)] hover:border-[var(--mist)] transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
