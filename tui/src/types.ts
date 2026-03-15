export type TrainingStartEvent = {
  type: 'training_start'
  model_type: string
  dataset: string
  epochs: number
  steps_per_epoch: number
  save_every_n_steps?: number | null
  save_every_n_epochs?: number | null
  checkpoint_every_n_minutes?: number | null
  adapter: { type: string; rank: number } | null
  optimizer: { type: string; lr: number; [key: string]: unknown }
  global_batch_size: number
  run_dir: string
  ts: number
}

export type StepEvent = {
  type: 'step'
  step: number
  epoch: number
  loss: number
  examples: number
  grad_norm?: number
  ts: number
}

export type EvalEvent = {
  type: 'eval'
  step: number
  name: string
  avg_loss: number
  quantile_losses: Record<string, number>
  ts: number
}

export type EpochEvent = {
  type: 'epoch'
  epoch: number
  epoch_loss: number
  ts: number
}

export type CheckpointEvent = {
  type: 'checkpoint'
  step: number
  epoch: number
  ts: number
}

export type SaveEvent = {
  type: 'save'
  step: number
  name: string
  ts: number
}

export type TrainingCompleteEvent = {
  type: 'training_complete'
  step: number
  epoch: number
  final_model: string
  ts: number
}

export type LogEvent = {
  type: 'log'
  message: string
  level: 'info' | 'warn' | 'error'
  ts: number
}

export type TrainingEvent =
  | TrainingStartEvent
  | StepEvent
  | EvalEvent
  | EpochEvent
  | CheckpointEvent
  | SaveEvent
  | TrainingCompleteEvent
  | LogEvent

export function parseEvent(line: string): TrainingEvent | null {
  try {
    return JSON.parse(line) as TrainingEvent
  } catch {
    return null
  }
}
