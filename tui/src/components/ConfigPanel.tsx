import React from 'react'
import { Box, Text } from 'ink'
import type { TrainingStartEvent } from '../types.js'

export function ConfigPanel({ config }: { config: TrainingStartEvent | null }) {
  if (!config) {
    return (
      <Box flexDirection="column">
        <Text color="gray" italic>
          Waiting for training to start…
        </Text>
      </Box>
    )
  }

  const rows = [
    ['model', config.model_type],
    ['epochs', config.epochs.toString()],
    ['batch_size', config.global_batch_size.toString()],
    ['optimizer', config.optimizer.type],
    ['lr', String(config.optimizer.lr)],
    ['adapter', config.adapter ? `${config.adapter.type} r=${config.adapter.rank}` : 'full'],
  ]

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white">
          {'  '}CONFIG
        </Text>
      </Box>
      {rows.map(([label, value]) => (
        <Box key={label}>
          <Box width={14}>
            <Text color="gray">{label}</Text>
          </Box>
          <Text>{value}</Text>
        </Box>
      ))}
    </Box>
  )
}
