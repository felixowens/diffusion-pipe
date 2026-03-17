import { readFileSync, existsSync, statSync } from 'fs'
import { watch } from 'chokidar'
import { parseEvent, type TrainingEvent } from './types.js'

export type EventCallback = (event: TrainingEvent) => void

/**
 * Tails an events.jsonl file. Reads all existing lines on start,
 * then watches for appended lines.
 */
export function tailEvents(
  filePath: string,
  onEvent: EventCallback,
): () => void {
  let bytesRead = 0

  function readNewLines() {
    if (!existsSync(filePath)) return

    const stat = statSync(filePath)
    if (stat.size <= bytesRead) return

    const fd = readFileSync(filePath, 'utf-8')
    const chunk = fd.slice(bytesRead)
    bytesRead = stat.size

    const lines = chunk.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const event = parseEvent(trimmed)
      if (event) onEvent(event)
    }
  }

  // Read existing content
  readNewLines()

  // Watch for changes
  const watcher = watch(filePath, {
    persistent: true,
    usePolling: true,
    interval: 250,
  })
  watcher.on('change', readNewLines)

  return () => {
    watcher.close()
  }
}
