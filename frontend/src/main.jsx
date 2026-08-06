import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ActiveDownloadsProvider } from "./context/ActiveDownloadsContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeProvider>
        <AuthProvider>
          <ActiveDownloadsProvider>
            <ToastProvider>
              <ErrorBoundary>
                <GoogleOAuthProvider
                  clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                >
                  <App />
                </GoogleOAuthProvider>
              </ErrorBoundary>
            </ToastProvider>
          </ActiveDownloadsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
