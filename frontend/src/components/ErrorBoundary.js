import React, { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console or monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorMessage: error.message,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback UI if provided, otherwise use default
      if (this.props.fallbackUI) {
        return this.props.fallbackUI;
      }
      
      // Default fallback UI
      return (
        <div className="error-boundary-container">
          <h2>Something went wrong</h2>
          <p>We're sorry, but there was an error loading this component.</p>
          <p className="error-message">{this.state.errorMessage}</p>
          {this.props.resetAction && (
            <button 
              onClick={this.props.resetAction}
              className="reset-button"
            >
              Reset
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 