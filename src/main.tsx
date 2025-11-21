import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { z } from 'zod'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import '@/styles/index.css'
import { zhCN } from 'zod/locales'
import { initializeMSW } from '@/lib/msw'
import { createAppQueryClient, setRouterInstance } from '@/lib/query-client'
import { createAppRouter } from '@/lib/router'
import { DirectionProvider } from '@/context/direction-provider'
import { FontProvider } from '@/context/font-provider'
import { ThemeProvider } from '@/context/theme-provider'

const renderApp = async (): Promise<void> => {
  const rootElement = document.getElementById('root')
  if (!rootElement || rootElement.innerHTML) return

  await initializeMSW()

  const queryClient = createAppQueryClient()
  const router = createAppRouter(queryClient)

  setRouterInstance(router)

  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}

z.config(zhCN())

renderApp()
