import type { ApiClient } from '@/lib/api/client'
import { createStepWithScreenshot, unwrap, type CaptureLinks } from '@/features/capture/step'
import type { JourneyRecording } from './types'

export interface PushJourneyResult {
  journeyId: string
  scenarioId: string
  stepCount: number
}

/**
 * Push a recorded multi-page journey: one journey → one scenario → N ordered
 * steps, each with its screenshot uploaded as a step file.
 */
export async function pushJourney(
  client: ApiClient,
  accountId: string,
  recording: JourneyRecording,
  links?: CaptureLinks,
): Promise<PushJourneyResult> {
  if (recording.steps.length === 0) {
    throw new Error('Add at least one page before sending the journey.')
  }
  const title = recording.title.trim() || 'Captured journey'

  const journey = unwrap(
    await client.POST('/v1/accounts/{account_id}/journeys', {
      params: { path: { account_id: accountId } },
      body: { type: 'customer', title },
    }),
    'create journey',
  ).item

  const scenario = unwrap(
    await client.POST('/v1/accounts/{account_id}/journeys/{journey_id}/scenarios', {
      params: { path: { account_id: accountId, journey_id: journey.id } },
      body: { type: 'nominal', title, criticity: 'medium' },
    }),
    'create scenario',
  ).item

  // Sequential to preserve step order.
  let order = 0
  for (const step of recording.steps) {
    order += 1
    await createStepWithScreenshot(
      client,
      { accountId, journeyId: journey.id, scenarioId: scenario.id },
      step,
      { title: step.title, note: step.note, links, order },
    )
  }

  return {
    journeyId: journey.id,
    scenarioId: scenario.id,
    stepCount: recording.steps.length,
  }
}
