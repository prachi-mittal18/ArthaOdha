import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI for localized component crashes
      return (
        <div style={{
          padding: "24px",
          border: "1px solid #ffccd5",
          backgroundColor: "#fff0f2",
          color: "#c9183b",
          borderRadius: "8px",
          margin: "20px",
          fontFamily: "Inter, Roboto, sans-serif",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
        }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Section Failed to Load</h4>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
            {this.state.error?.message || "An unexpected error occurred in this view."}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "8px 16px",
              backgroundColor: "#c9183b",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#a80f2d"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#c9183b"}
          >
            Retry Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
