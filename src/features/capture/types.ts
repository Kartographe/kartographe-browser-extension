/** A single page capture collected from the active tab. */
export interface PageCapture {
  url: string
  title: string
  favIconUrl: string | null
  domain: string
  /** ISO timestamp of the capture. */
  capturedAt: string
  /** Screenshot of the visible tab as a data URL (image/jpeg). */
  screenshotDataUrl: string
}
