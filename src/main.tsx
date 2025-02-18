import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SuspenseWrapper } from "@/components/suspense-wrapper";
import "./services/interceptor";
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

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <SuspenseWrapper>
          <RouterProvider router={router} />
        </SuspenseWrapper>
        <Toaster />
      </ThemeProvider>
    </StrictMode>
  );
});
