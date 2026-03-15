/**
 * Contract test: reads a JSONL file written by Python's EventLogger
 * and validates every event against the expected TypeScript types.
 *
 * Usage: tsx src/test-contract.ts <path-to-events.jsonl>
 */

import { readFileSync } from 'fs'
import type {
  TrainingEvent,
  TrainingStartEvent,
  StepEvent,
  EvalEvent,
  EpochEvent,
  CheckpointEvent,
  SaveEvent,
  LogEvent,
  TrainingCompleteEvent,
} from './types.js'
import { parseEvent } from './types.js'

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: tsx src/test-contract.ts <path-to-events.jsonl>')
  process.exit(1)
}

const content = readFileSync(filePath, 'utf-8')
const lines = content.split('\n').filter((l) => l.trim())

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ ${msg}`)
    failed++
  } else {
    passed++
  }
}

function assertField(event: Record<string, unknown>, field: string, type: string) {
  assert(field in event, `missing field '${field}' in ${event.type} event`)
  if (field in event && type !== 'any') {
    const actual = event[field] === null ? 'null' : typeof event[field]
    assert(
      actual === type || (type === 'null' && event[field] === null),
      `field '${field}' expected ${type}, got ${actual} in ${event.type} event`,
    )
  }
}

function assertOptionalField(event: Record<string, unknown>, field: string, type: string) {
  if (field in event) {
    const actual = typeof event[field]
    assert(actual === type, `optional field '${field}' expected ${type}, got ${actual} in ${event.type} event`)
  }
}

for (let i = 0; i < lines.length; i++) {
  const event = parseEvent(lines[i])
  assert(event !== null, `line ${i + 1}: failed to parse JSON`)
  if (!event) continue

  assert(typeof event.ts === 'number', `line ${i + 1}: missing or invalid ts`)

  const e = event as Record<string, unknown>

  switch (event.type) {
    case 'training_start':
      assertField(e, 'model_type', 'string')
      assertField(e, 'dataset', 'string')
      assertField(e, 'epochs', 'number')
      assertField(e, 'steps_per_epoch', 'number')
      assertField(e, 'global_batch_size', 'number')
      assertField(e, 'run_dir', 'string')
      assert('adapter' in e, 'missing adapter field')
      assert('optimizer' in e, 'missing optimizer field')
      if (e.optimizer && typeof e.optimizer === 'object') {
        const opt = e.optimizer as Record<string, unknown>
        assertField(opt, 'type', 'string')
      }
      break

    case 'step':
      assertField(e, 'step', 'number')
      assertField(e, 'epoch', 'number')
      assertField(e, 'loss', 'number')
      assertField(e, 'examples', 'number')
      assertOptionalField(e, 'grad_norm', 'number')
      break

    case 'eval':
      assertField(e, 'step', 'number')
      assertField(e, 'name', 'string')
      assertField(e, 'avg_loss', 'number')
      assert(
        'quantile_losses' in e && typeof e.quantile_losses === 'object',
        'missing or invalid quantile_losses in eval event',
      )
      break

    case 'epoch':
      assertField(e, 'epoch', 'number')
      assertField(e, 'epoch_loss', 'number')
      break

    case 'checkpoint':
      assertField(e, 'step', 'number')
      assertField(e, 'epoch', 'number')
      break

    case 'save':
      assertField(e, 'step', 'number')
      assertField(e, 'name', 'string')
      break

    case 'log':
      assertField(e, 'message', 'string')
      assertField(e, 'level', 'string')
      assert(
        ['info', 'warn', 'error'].includes(e.level as string),
        `invalid log level: ${e.level}`,
      )
      break

    case 'training_complete':
      assertField(e, 'step', 'number')
      assertField(e, 'epoch', 'number')
      assertField(e, 'final_model', 'string')
      break

    default:
      console.error(`  ✗ unknown event type: ${event.type}`)
      failed++
  }
}

console.log(`\n${lines.length} events validated: ${passed} assertions passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
} else {
  console.log('✓ Contract test passed')
}
