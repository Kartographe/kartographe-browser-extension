import { useMutation } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/hooks'
import { useConfig } from '@/lib/storage/hooks'
import { captureActiveTab } from './capture'
import { pushSingleCapture, type PushCaptureOptions } from './push'
import type { PageCapture } from './types'

export function useCaptureTab() {
  return useMutation({ mutationFn: captureActiveTab })
}

export function usePushCapture() {
  const client = useApiClient()
  const { data: config } = useConfig()

  return useMutation({
    mutationFn: (input: { capture: PageCapture; options?: PushCaptureOptions }) => {
      if (!client) throw new Error('Set the server URL first.')
      if (!config?.accountId) throw new Error('Select an account in settings first.')
      return pushSingleCapture(client, config.accountId, input.capture, input.options)
    },
  })
}
