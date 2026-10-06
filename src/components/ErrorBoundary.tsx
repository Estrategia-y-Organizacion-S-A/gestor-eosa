import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 bg-red-50 border border-red-200 rounded-2xl text-center max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 bg-red-100 text-brand-red rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {this.props.fallbackTitle || 'Ha ocurrido un error al cargar esta sección'}
          </h3>
          <p className="text-xs text-gray-600 mb-4 leading-relaxed font-mono bg-white/70 p-2 rounded-lg border border-red-100">
            {this.state.error?.message || 'Error inesperado al renderizar los datos.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-xl hover:bg-brand-red/90 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
