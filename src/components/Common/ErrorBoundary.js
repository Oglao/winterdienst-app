import React from 'react';
import debugLogger from '../../utils/debugLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    debugLogger.error('ERROR_BOUNDARY', 'Component error caught', { error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            🚨 Komponente-Fehler
          </h2>
          <p className="text-sm text-red-600 mb-4">
            Ein Fehler ist in dieser Komponente aufgetreten.
          </p>
          
          {this.props.showDetails && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-red-700">
                Fehler-Details anzeigen
              </summary>
              <div className="mt-2 text-xs font-mono bg-red-100 p-2 rounded overflow-x-auto">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </div>
            </details>
          )}
          
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              debugLogger.log('ERROR_BOUNDARY', 'Component reset attempted');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Komponente neu laden
          </button>
          
          {this.props.fallback && (
            <div className="mt-4 pt-4 border-t border-red-200">
              <h3 className="text-sm font-medium text-red-700 mb-2">Alternative:</h3>
              {this.props.fallback}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;