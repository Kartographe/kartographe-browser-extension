import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { antdLocale } from '@/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

/** Shared providers for both the side panel and options React roots. */
export function Providers({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={antdLocale(i18n.language)}
        theme={{ token: { colorPrimary: '#4f46e5' } }}
      >
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
