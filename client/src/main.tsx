import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider showUserSwitcher={false}>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
