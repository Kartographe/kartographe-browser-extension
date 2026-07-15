import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { antdLocale, BROWSER_LNG } from '@/i18n'
import { useConfig } from '@/lib/storage/hooks'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

/** Applies the persisted UI language (null = follow the browser). */
function LanguageSync() {
  const { data: config } = useConfig()
  const language = config?.language ?? null
  useEffect(() => {
    if (!config) return
    const target = language ?? BROWSER_LNG
    if (i18n.language !== target) void i18n.changeLanguage(target)
  }, [config, language])
  return null
}

/** Shared providers for both the side panel and options React roots. */
export function Providers({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation()
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageSync />
      <ConfigProvider
        locale={antdLocale(i18nInstance.language)}
        theme={{ token: { colorPrimary: '#4f46e5' } }}
      >
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
