import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SuspenseWrapper } from "@/components/suspense-wrapper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";

import "@/services/interceptor";
import "./index.css";

async function enableMocking() {
  if (
    import.meta.env.MODE !== "development" ||
    import.meta.env.VITE_MOCK !== "true"
  ) {
    return;
  }

  const { worker } = await import("./mocks/browser");
  return worker.start({
    onUnhandledRequest: "bypass",
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="theme">
          <SuspenseWrapper>
            <NuqsAdapter>
              <RouterProvider router={router} />
            </NuqsAdapter>
          </SuspenseWrapper>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
});
