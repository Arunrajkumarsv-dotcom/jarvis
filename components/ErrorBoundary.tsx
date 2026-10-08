"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Jarvis Error Boundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center font-mono p-5 text-center">
          <h1 className="text-2xl mb-4">SYSTEM CRITICAL ERROR</h1>
          <p className="text-sm opacity-70 mb-8">The Jarvis HUD encountered an unrecoverable failure.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-red-500/50 hover:bg-red-500/10 transition-colors text-xs uppercase tracking-widest"
          >
            Reboot System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
