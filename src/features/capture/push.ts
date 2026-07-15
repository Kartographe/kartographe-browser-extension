import type { ApiClient } from '@/lib/api/client'
import {
  createStepWithScreenshot,
  unwrap,
  type CaptureLinks,
} from './step'
import type { PageCapture } from './types'

export type { CaptureLinks } from './step'

export interface PushCaptureOptions {
  /** Optional title override for the journey/step (defaults to the page title). */
  title?: string
  /** Optional free-text annotation stored on the step. */
  note?: string
  /** Optional application/service association (stored on the step parameters). */
  links?: CaptureLinks
}

export interface PushCaptureResult {
  journeyId: string
  scenarioId: string
  stepId: string
  fileId: string
}

/**
 * Push a single page capture into Kartographe.
 *
 * The screenshot can only be persisted as a journey step file, so a single
 * capture is modelled as a one-step journey: journey → scenario → step → file.
 */
export async function pushSingleCapture(
  client: ApiClient,
  accountId: string,
  capture: PageCapture,
  options: PushCaptureOptions = {},
): Promise<PushCaptureResult> {
  const title = options.title?.trim() || capture.title || capture.domain

  const journey = unwrap(
    await client.POST('/v1/accounts/{account_id}/journeys', {
      params: { path: { account_id: accountId } },
      body: { type: 'other', title },
    }),
    'create journey',
  ).item

  const scenario = unwrap(
    await client.POST(
      '/v1/accounts/{account_id}/journeys/{journey_id}/scenarios',
      {
        params: { path: { account_id: accountId, journey_id: journey.id } },
        body: { type: 'nominal', title, criticity: 'medium' },
      },
    ),
    'create scenario',
  ).item

  const { stepId, fileId } = await createStepWithScreenshot(
    client,
    { accountId, journeyId: journey.id, scenarioId: scenario.id },
    capture,
    { title, note: options.note, links: options.links },
  )

  return { journeyId: journey.id, scenarioId: scenario.id, stepId, fileId }
}
