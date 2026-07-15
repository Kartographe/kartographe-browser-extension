import type { PageCapture } from '@/features/capture/types'
import {
  EMPTY_RECORDING,
  type JourneyRecording,
  type RecordedStep,
} from './types'

const RECORDING_KEY = 'kartographe.journey.recording'

export async function getRecording(): Promise<JourneyRecording> {
  const stored = await chrome.storage.local.get(RECORDING_KEY)
  return (stored[RECORDING_KEY] as JourneyRecording | undefined) ?? EMPTY_RECORDING
}

async function save(recording: JourneyRecording): Promise<JourneyRecording> {
  await chrome.storage.local.set({ [RECORDING_KEY]: recording })
  return recording
}

export async function startRecording(title: string): Promise<JourneyRecording> {
  return save({ active: true, title, steps: [] })
}

export async function setRecordingTitle(title: string): Promise<JourneyRecording> {
  const current = await getRecording()
  return save({ ...current, title })
}

export async function addStep(
  capture: PageCapture,
  note?: string,
): Promise<JourneyRecording> {
  const current = await getRecording()
  const step: RecordedStep = {
    ...capture,
    localId: crypto.randomUUID(),
    ...(note ? { note } : {}),
  }
  return save({ ...current, active: true, steps: [...current.steps, step] })
}

export async function removeStep(localId: string): Promise<JourneyRecording> {
  const current = await getRecording()
  return save({
    ...current,
    steps: current.steps.filter((s) => s.localId !== localId),
  })
}

export async function clearRecording(): Promise<JourneyRecording> {
  await chrome.storage.local.remove(RECORDING_KEY)
  return EMPTY_RECORDING
}
