import React from 'react'
import { Box, Text } from 'ink'
import type { TrainingState } from '../hooks/use-events.js'

function formatDuration(seconds: number): string {
  if (seconds < 0) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return `${m}m${s > 0 ? ` ${s}s` : ''}`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return `${h}h${m > 0 ? ` ${m}m` : ''}`
}

function computeStepsPerSec(state: TrainingState): number | null {
  if (state.steps.length < 2) return null
  // Use recent window for more accurate current rate
  const window = state.steps.slice(-50)
  if (window.length < 2) return null
  const elapsed = window[window.length - 1].ts - window[0].ts
  if (elapsed <= 0) return null
  return (window.length - 1) / elapsed
}

type ETA = {
  label: string
  value: string
}

function computeETAs(state: TrainingState): ETA[] {
  const etas: ETA[] = []
  const { config, latestStep } = state
  if (!config || !latestStep) return etas

  const sps = computeStepsPerSec(state)
  if (!sps) return etas

  const stepsPerEpoch = config.steps_per_epoch
  const totalSteps = config.epochs * stepsPerEpoch
  const currentStep = latestStep.step

  // ETA epoch end
  const stepInEpoch = ((currentStep - 1) % stepsPerEpoch) + 1
  const stepsToEpochEnd = stepsPerEpoch - stepInEpoch
  if (stepsToEpochEnd > 0) {
    etas.push({ label: 'epoch', value: formatDuration(stepsToEpochEnd / sps) })
  }

  // ETA training end
  const stepsRemaining = totalSteps - currentStep
  if (stepsRemaining > 0) {
    etas.push({ label: 'done', value: formatDuration(stepsRemaining / sps) })
  }

  // ETA next save
  if (config.save_every_n_steps) {
    const stepsToSave = config.save_every_n_steps - (currentStep % config.save_every_n_steps)
    etas.push({ label: 'save', value: formatDuration(stepsToSave / sps) })
  } else if (config.save_every_n_epochs) {
    const epochsToSave = config.save_every_n_epochs - ((latestStep.epoch - 1) % config.save_every_n_epochs)
    const stepsToSave = stepsToEpochEnd + (epochsToSave - 1) * stepsPerEpoch
    etas.push({ label: 'save', value: formatDuration(stepsToSave / sps) })
  }

  return etas
}

export function StatusBar({ state }: { state: TrainingState }) {
  if (state.done) {
    return (
      <Box>
        <Text color="green" bold>
          ✓ Training complete
        </Text>
      </Box>
    )
  }

  if (!state.latestStep) {
    return (
      <Box>
        <Text color="gray" italic>
          Waiting for events…
        </Text>
      </Box>
    )
  }

  const sps = computeStepsPerSec(state)
  const etas = computeETAs(state)

  return (
    <Box gap={2} flexWrap="wrap">
      <Text color="yellow">●</Text>
      <Text>
        step <Text bold>{state.latestStep.step}</Text>
      </Text>
      <Text>
        epoch <Text bold>{state.latestStep.epoch}</Text>
      </Text>
      <Text>
        loss <Text bold>{state.latestStep.loss.toFixed(4)}</Text>
      </Text>
      {sps !== null && <Text color="gray">{sps.toFixed(2)} steps/s</Text>}
      {etas.length > 0 && (
        <>
          <Text color="gray">│</Text>
          {etas.map((eta) => (
            <Text key={eta.label} color="gray">
              {eta.label} <Text color="white">{eta.value}</Text>
            </Text>
          ))}
        </>
      )}
    </Box>
  )
}
