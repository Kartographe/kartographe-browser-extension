import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useApiClient } from '@/lib/api/hooks'
import { useConfig } from '@/lib/storage/hooks'
import { captureActiveTab } from './capture'
import { pushSingleCapture, type PushCaptureOptions } from './push'
import type { PageCapture } from './types'

export function useCaptureTab() {
  return useMutation({ mutationFn: captureActiveTab })
}

export function usePushCapture() {
  const { t } = useTranslation()
  const client = useApiClient()
  const { data: config } = useConfig()

  return useMutation({
    mutationFn: (input: { capture: PageCapture; options?: PushCaptureOptions }) => {
      if (!client) throw new Error(t('errors.setServerFirst'))
      if (!config?.accountId) throw new Error(t('errors.selectAccountFirst'))
      return pushSingleCapture(client, config.accountId, input.capture, input.options)
    },
  })
}
