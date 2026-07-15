import type { ApiClient } from '@/lib/api/client'
import { formDataSerializer } from '@/lib/api/client'
import { dataUrlToBlob } from './capture'
import type { PageCapture } from './types'

/** Optional links associating the capture with existing/created entities. */
export interface CaptureLinks {
  applicationId?: string
  applicationTitle?: string
  serviceId?: string
  serviceTitle?: string
}

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

function unwrap<T>(res: { data?: T; error?: unknown }, what: string): T {
  if (res.error || res.data === undefined) {
    throw new Error(`Failed to ${what}.`)
  }
  return res.data
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
  const links = options.links ?? {}
  const stepParameters = {
    url: capture.url,
    domain: capture.domain,
    favIconUrl: capture.favIconUrl,
    capturedAt: capture.capturedAt,
    ...(options.note ? { note: options.note } : {}),
    ...(links.applicationId
      ? { applicationId: links.applicationId, applicationTitle: links.applicationTitle }
      : {}),
    ...(links.serviceId
      ? { serviceId: links.serviceId, serviceTitle: links.serviceTitle }
      : {}),
  }

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

  const step = unwrap(
    await client.POST(
      '/v1/accounts/{account_id}/journeys/{journey_id}/scenarios/{scenario_id}/steps',
      {
        params: {
          path: {
            account_id: accountId,
            journey_id: journey.id,
            scenario_id: scenario.id,
          },
        },
        body: { title, optional: false, parameters: stepParameters },
      },
    ),
    'create step',
  ).item

  const blob = await dataUrlToBlob(capture.screenshotDataUrl)
  const file = new File([blob], `capture-${Date.now()}.jpg`, {
    type: blob.type || 'image/jpeg',
  })

  const uploaded = unwrap(
    await client.POST(
      '/v1/accounts/{account_id}/journeys/{journey_id}/scenarios/{scenario_id}/steps/{step_id}/files',
      {
        params: {
          path: {
            account_id: accountId,
            journey_id: journey.id,
            scenario_id: scenario.id,
            step_id: step.id,
          },
        },
        body: { file } as unknown as { file: string },
        bodySerializer: formDataSerializer as never,
      },
    ),
    'upload screenshot',
  ).item

  return {
    journeyId: journey.id,
    scenarioId: scenario.id,
    stepId: step.id,
    fileId: uploaded.id,
  }
}
