import React from 'react'
import { Box, Text } from 'ink'
import type { LogEvent } from '../types.js'

const LEVEL_COLORS: Record<LogEvent['level'], string> = {
  info: 'gray',
  warn: 'yellow',
  error: 'red',
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000)
  return d.toLocaleTimeString('en-GB', { hour12: false })
}

type Props = {
  logs: LogEvent[]
  maxLines?: number
}

export function LogPanel({ logs, maxLines = 8 }: Props) {
  const visible = logs.slice(-maxLines)

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white">
          {'  '}LOG
        </Text>
      </Box>
      {visible.length === 0 ? (
        <Text color="gray" italic>
          No log messages yet
        </Text>
      ) : (
        visible.map((log, i) => (
          <Box key={i} gap={1}>
            <Text color="gray">{formatTime(log.ts)}</Text>
            <Text color={LEVEL_COLORS[log.level]}>{log.message}</Text>
          </Box>
        ))
      )}
    </Box>
  )
}
