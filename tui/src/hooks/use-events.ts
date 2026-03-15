import { useState, useEffect, useCallback } from 'react'
import { tailEvents } from '../event-reader.js'
import type {
  TrainingEvent,
  TrainingStartEvent,
  StepEvent,
  EvalEvent,
  EpochEvent,
  LogEvent,
} from '../types.js'

export type TrainingState = {
  config: TrainingStartEvent | null
  steps: StepEvent[]
  evals: EvalEvent[]
  epochs: EpochEvent[]
  logs: LogEvent[]
  latestStep: StepEvent | null
  latestEval: EvalEvent | null
  done: boolean
}

const INITIAL_STATE: TrainingState = {
  config: null,
  steps: [],
  evals: [],
  epochs: [],
  logs: [],
  latestStep: null,
  latestEval: null,
  done: false,
}

const MAX_LOGS = 100

export function useEvents(filePath: string): TrainingState {
  const [state, setState] = useState<TrainingState>(INITIAL_STATE)

  const handleEvent = useCallback((event: TrainingEvent) => {
    setState((prev) => {
      switch (event.type) {
        case 'training_start':
          return { ...prev, config: event }
        case 'step': {
          const steps = [...prev.steps, event]
          return { ...prev, steps, latestStep: event }
        }
        case 'eval': {
          const evals = [...prev.evals, event]
          return { ...prev, evals, latestEval: event }
        }
        case 'epoch': {
          const epochs = [...prev.epochs, event]
          return { ...prev, epochs }
        }
        case 'log': {
          const logs = [...prev.logs, event].slice(-MAX_LOGS)
          return { ...prev, logs }
        }
        case 'training_complete':
          return { ...prev, done: true }
        default:
          return prev
      }
    })
  }, [])

  useEffect(() => {
    const cleanup = tailEvents(filePath, handleEvent)
    return cleanup
  }, [filePath, handleEvent])

  return state
}
