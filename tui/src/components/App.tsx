import React from 'react'
import { Box, Text } from 'ink'
import { useEvents } from '../hooks/use-events.js'
import { MetricsPanel } from './MetricsPanel.js'
import { ConfigPanel } from './ConfigPanel.js'
import { LogPanel } from './LogPanel.js'
import { StatusBar } from './StatusBar.js'

type Props = {
  eventsFile: string
}

export function App({ eventsFile }: Props) {
  const state = useEvents(eventsFile)

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ◆ diffusion-pipe
        </Text>
        <Text color="gray"> — {eventsFile}</Text>
      </Box>

      <Box gap={4}>
        <MetricsPanel state={state} />
        <ConfigPanel config={state.config} />
      </Box>

      <Box marginTop={1}>
        <LogPanel logs={state.logs} />
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <StatusBar state={state} />
      </Box>
    </Box>
  )
}
