import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif", backgroundColor: "#F2EADA", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Oops, something went wrong.</h2>
          <p style={{ color: "#FF5C39", marginBottom: "2rem" }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: "12px 24px", backgroundColor: "#FFD84D", border: "none", borderRadius: "9999px", fontWeight: "bold", cursor: "pointer" }}
          >
            Reload Roomie
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
