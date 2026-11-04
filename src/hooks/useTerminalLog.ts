import { useCallback, useState } from 'react'

/** Lines shown in the lab terminal, with stable helpers to append or clear. */
export function useTerminalLog(initialLines: string[]) {
  const [logs, setLogs] = useState<string[]>(initialLines)

  const log = useCallback((...lines: string[]) => {
    setLogs((prev) => [...prev, ...lines])
  }, [])

  const clear = useCallback(() => setLogs([]), [])

  return { logs, log, clear }
}

export type LogFn = (...lines: string[]) => void

/** Formats an unknown thrown value as a terminal error line. */
export function errorLine(err: unknown, prefix = '[ERROR]'): string {
  return `${prefix} ${err instanceof Error ? err.message : String(err)}`
}
