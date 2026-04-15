import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/error/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary
    onError={(error, info) => {
      // In production, send to error tracking service (Sentry, etc.)
      console.error("App Error:", {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        timestamp: new Date().toISOString(),
      });
    }}
  >
    <App />
  </ErrorBoundary>
);
