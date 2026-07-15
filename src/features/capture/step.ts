import type { ApiClient } from '@/lib/api/client'
import { formDataSerializer } from '@/lib/api/client'
import { dataUrlToBlob } from './capture'
import type { PageCapture } from './types'

/** Optional links associating a step with existing/created entities. */
export interface CaptureLinks {
  applicationId?: string
  applicationTitle?: string
  serviceId?: string
  serviceTitle?: string
}

export interface StepIds {
  accountId: string
  journeyId: string
  scenarioId: string
}

export interface StepOptions {
  title?: string
  note?: string
  links?: CaptureLinks
  /** 1-based position within the scenario, stored in parameters for ordering. */
  order?: number
}

export function unwrap<T>(res: { data?: T; error?: unknown }, what: string): T {
  if (res.error || res.data === undefined) {
    throw new Error(`Failed to ${what}.`)
  }
  return res.data
}

function stepParameters(capture: PageCapture, options: StepOptions) {
  const links = options.links ?? {}
  return {
    url: capture.url,
    domain: capture.domain,
    favIconUrl: capture.favIconUrl,
    capturedAt: capture.capturedAt,
    ...(options.order ? { order: options.order } : {}),
    ...(options.note ? { note: options.note } : {}),
    ...(links.applicationId
      ? { applicationId: links.applicationId, applicationTitle: links.applicationTitle }
      : {}),
    ...(links.serviceId
      ? { serviceId: links.serviceId, serviceTitle: links.serviceTitle }
      : {}),
  }
}

/**
 * Create a journey step from a capture and upload its screenshot as a step file.
 * Screenshots can only be persisted as step files, so this is the single place
 * that turns a capture into a persisted step.
 */
export async function createStepWithScreenshot(
  client: ApiClient,
  ids: StepIds,
  capture: PageCapture,
  options: StepOptions = {},
): Promise<{ stepId: string; fileId: string }> {
  const title = options.title?.trim() || capture.title || capture.domain

  const step = unwrap(
    await client.POST(
      '/v1/accounts/{account_id}/journeys/{journey_id}/scenarios/{scenario_id}/steps',
      {
        params: {
          path: {
            account_id: ids.accountId,
            journey_id: ids.journeyId,
            scenario_id: ids.scenarioId,
          },
        },
        body: { title, optional: false, parameters: stepParameters(capture, options) },
      },
    ),
    'create step',
  ).item

  const blob = await dataUrlToBlob(capture.screenshotDataUrl)
  const file = new File([blob], `capture-${step.id}.jpg`, {
    type: blob.type || 'image/jpeg',
  })

  const uploaded = unwrap(
    await client.POST(
      '/v1/accounts/{account_id}/journeys/{journey_id}/scenarios/{scenario_id}/steps/{step_id}/files',
      {
        params: {
          path: {
            account_id: ids.accountId,
            journey_id: ids.journeyId,
            scenario_id: ids.scenarioId,
            step_id: step.id,
          },
        },
        body: { file } as unknown as { file: string },
        bodySerializer: formDataSerializer as never,
      },
    ),
    'upload screenshot',
  ).item

  return { stepId: step.id, fileId: uploaded.id }
}
