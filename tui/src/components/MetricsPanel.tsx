import React from 'react'
import { Box, Text } from 'ink'
import { Sparkline } from './Sparkline.js'
import type { TrainingState } from '../hooks/use-events.js'

type MetricRow = {
  label: string
  values: number[]
  current: string
  color: string
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  if (Number.isInteger(n)) return n.toString()
  if (Math.abs(n) < 0.001) return n.toExponential(2)
  return n.toFixed(4)
}

function buildMetrics(state: TrainingState): MetricRow[] {
  const rows: MetricRow[] = []

  const losses = state.steps.map((s) => s.loss)
  rows.push({
    label: 'loss',
    values: losses,
    current: state.latestStep ? formatNumber(state.latestStep.loss) : '—',
    color: 'green',
  })

  const gradNorms = state.steps
    .filter((s) => s.grad_norm !== undefined)
    .map((s) => s.grad_norm!)
  if (gradNorms.length > 0) {
    rows.push({
      label: 'grad_norm',
      values: gradNorms,
      current: formatNumber(gradNorms[gradNorms.length - 1]),
      color: 'yellow',
    })
  }

  rows.push({
    label: 'step',
    values: state.steps.map((s) => s.step),
    current: state.latestStep ? state.latestStep.step.toString() : '0',
    color: 'red',
  })

  rows.push({
    label: 'epoch',
    values: state.steps.map((s) => s.epoch),
    current: state.latestStep ? state.latestStep.epoch.toString() : '0',
    color: 'magenta',
  })

  if (state.evals.length > 0) {
    const evalLosses = state.evals.map((e) => e.avg_loss)
    rows.push({
      label: 'eval_loss',
      values: evalLosses,
      current: formatNumber(evalLosses[evalLosses.length - 1]),
      color: 'cyan',
    })
  }

  const epochLosses = state.epochs.map((e) => e.epoch_loss)
  if (epochLosses.length > 0) {
    rows.push({
      label: 'epoch_loss',
      values: epochLosses,
      current: formatNumber(epochLosses[epochLosses.length - 1]),
      color: 'blue',
    })
  }

  return rows
}

const LABEL_WIDTH = 14
const SPARKLINE_WIDTH = 24

export function MetricsPanel({ state }: { state: TrainingState }) {
  const metrics = buildMetrics(state)

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white">
          {'  '}METRICS
        </Text>
      </Box>
      {metrics.map((m) => (
        <Box key={m.label}>
          <Box width={LABEL_WIDTH}>
            <Text color={m.color} bold>
              {m.label.padEnd(LABEL_WIDTH)}
            </Text>
          </Box>
          <Sparkline values={m.values} width={SPARKLINE_WIDTH} color={m.color} />
          <Box marginLeft={1} width={12} justifyContent="flex-end">
            <Text>{m.current}</Text>
          </Box>
        </Box>
      ))}
    </Box>
  )
}
