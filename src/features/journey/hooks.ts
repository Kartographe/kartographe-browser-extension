import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useApiClient } from '@/lib/api/hooks'
import { useConfig } from '@/lib/storage/hooks'
import { captureActiveTab } from '@/features/capture/capture'
import type { CaptureLinks } from '@/features/capture/push'
import {
  addStep,
  clearRecording,
  getRecording,
  removeStep,
  setRecordingTitle,
  startRecording,
} from './recorder'
import { pushJourney } from './push'
import type { JourneyRecording } from './types'

const RECORDING_QUERY_KEY = ['journey-recording'] as const

export function useRecording() {
  return useQuery({ queryKey: RECORDING_QUERY_KEY, queryFn: getRecording })
}

function useRecordingMutation<TArgs>(
  fn: (args: TArgs) => Promise<JourneyRecording>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (recording) => {
      queryClient.setQueryData(RECORDING_QUERY_KEY, recording)
    },
  })
}

export function useStartRecording() {
  return useRecordingMutation((title: string) => startRecording(title))
}

export function useSetRecordingTitle() {
  return useRecordingMutation((title: string) => setRecordingTitle(title))
}

export function useRemoveStep() {
  return useRecordingMutation((localId: string) => removeStep(localId))
}

export function useClearRecording() {
  return useRecordingMutation<void>(() => clearRecording())
}

export function useAddCurrentPage() {
  return useRecordingMutation(async (note?: string) => {
    const capture = await captureActiveTab()
    return addStep(capture, note)
  })
}

export function usePushJourney() {
  const { t } = useTranslation()
  const client = useApiClient()
  const { data: config } = useConfig()
  return useMutation({
    mutationFn: (input: { recording: JourneyRecording; links?: CaptureLinks }) => {
      if (!client) throw new Error(t('errors.setServerFirst'))
      if (!config?.accountId) throw new Error(t('errors.selectAccountFirst'))
      return pushJourney(client, config.accountId, input.recording, input.links)
    },
  })
}
