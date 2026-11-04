import confetti from 'canvas-confetti'

type Fire = (options?: confetti.Options) => void

let fire: Fire | null = null

/**
 * Confetti burst for achievements and passing pipelines.
 *
 * The library's default instance renders in a Web Worker created from a
 * `blob:` URL, which our Content-Security-Policy (worker-src falls back to
 * default-src 'none') blocks. A main-thread instance needs no CSP exception.
 */
export function celebrate(options: confetti.Options): void {
  fire ??= confetti.create(undefined, { resize: true, useWorker: false })
  fire(options)
}
