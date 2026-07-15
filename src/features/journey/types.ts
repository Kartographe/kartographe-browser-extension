import type { PageCapture } from '@/features/capture/types'

/** One recorded step of an in-progress journey. */
export interface RecordedStep extends PageCapture {
  /** Local id (client-generated) used for list keys and removal. */
  localId: string
  /** Optional per-step annotation. */
  note?: string
}

/** In-progress multi-page journey buffered in chrome.storage.local. */
export interface JourneyRecording {
  active: boolean
  title: string
  steps: RecordedStep[]
}

export const EMPTY_RECORDING: JourneyRecording = {
  active: false,
  title: '',
  steps: [],
}
