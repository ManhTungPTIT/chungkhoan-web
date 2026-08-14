import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { initializeTokenStorage } from "./feature/auth/admin/untils/tokenStorage";

const queryClient = new QueryClient();

async function bootstrap() {
  // Migrate refresh token plaintext của các bản app cũ vào Android Keystore
  // trước khi route bảo vệ hoặc interceptor auth bắt đầu chạy.
  await initializeTokenStorage();

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
