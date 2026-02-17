"use client";

import * as React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="min-h-[400px] flex items-center justify-center p-8">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 max-w-lg">
              <h2 className="text-lg font-semibold text-destructive mb-2">
                Error al cargar la página
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.error.message}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-primary hover:underline"
              >
                Recargar página
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
