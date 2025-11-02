import React from 'react';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can log to an external service here
    // console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-card/90 border border-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">An unexpected error occurred. Check the console for details.</p>
            <pre className="text-xs max-h-48 overflow-auto bg-muted/10 p-2 rounded">{String(this.state.error)}</pre>
            <div className="mt-4 flex gap-2">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded" onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
