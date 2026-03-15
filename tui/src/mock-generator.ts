import { writeFileSync, appendFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'

/**
 * Generates fake training events to a JSONL file.
 * Usage: tsx src/mock-generator.ts [output-path]
 */

const outputPath = process.argv[2] || '/tmp/diffusion-pipe-mock/events.jsonl'
mkdirSync(dirname(outputPath), { recursive: true })

function emit(event: Record<string, unknown>) {
  event.ts = Date.now() / 1000
  appendFileSync(outputPath, JSON.stringify(event) + '\n')
}

// Config
const totalEpochs = 5
const stepsPerEpoch = 200
const evalEveryNSteps = 50
const saveEveryNEpochs = 1

// Start fresh
writeFileSync(outputPath, '')

emit({
  type: 'training_start',
  model_type: 'anima',
  dataset: '/data/my-dataset/dataset.toml',
  epochs: totalEpochs,
  steps_per_epoch: stepsPerEpoch,
  save_every_n_steps: null,
  save_every_n_epochs: saveEveryNEpochs,
  checkpoint_every_n_minutes: 30,
  adapter: { type: 'lora', rank: 16 },
  optimizer: { type: 'adamw_optimi', lr: 5e-5, betas: [0.9, 0.99], weight_decay: 0.01 },
  global_batch_size: 4,
  run_dir: '/output/20260315_18-00-00',
})

emit({ type: 'log', level: 'info', message: 'Training started' })

console.log(`Writing mock events to ${outputPath}`)
console.log('Press Ctrl+C to stop\n')

let step = 0
let epoch = 1
let baseLoss = 0.15

const interval = setInterval(() => {
  step++

  // Loss decreases over time with noise
  const progress = step / (totalEpochs * stepsPerEpoch)
  const loss = baseLoss * (1 - progress * 0.6) + (Math.random() - 0.5) * 0.01
  const gradNorm = 0.8 + Math.random() * 0.8

  emit({
    type: 'step',
    step,
    epoch,
    loss: Math.max(0.001, loss),
    examples: step * 4,
    grad_norm: gradNorm,
  })

  process.stdout.write(`\rstep ${step} | epoch ${epoch} | loss ${loss.toFixed(4)}`)

  // Eval
  if (step % evalEveryNSteps === 0) {
    emit({ type: 'log', level: 'info', message: `Running evaluation at step ${step}` })
    const quantileLosses: Record<string, number> = {}
    const quantiles = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
    for (const q of quantiles) {
      quantileLosses[`q${q.toFixed(2)}`] = loss * (0.8 + q * 0.4) + (Math.random() - 0.5) * 0.005
    }
    const avgLoss = Object.values(quantileLosses).reduce((a, b) => a + b, 0) / quantiles.length
    emit({ type: 'eval', step, name: 'eval0', avg_loss: avgLoss, quantile_losses: quantileLosses })
  }

  // Epoch boundary
  if (step % stepsPerEpoch === 0) {
    const epochLoss = loss + (Math.random() - 0.5) * 0.005
    emit({ type: 'epoch', epoch, epoch_loss: epochLoss })
    emit({ type: 'log', level: 'info', message: `Epoch ${epoch} complete — loss ${epochLoss.toFixed(4)}` })
    emit({ type: 'save', step, name: `epoch${epoch}` })
    emit({ type: 'log', level: 'info', message: `Model saved: epoch${epoch}` })
    emit({ type: 'checkpoint', step, epoch })
    emit({ type: 'log', level: 'info', message: `Checkpoint saved at step ${step}` })
    epoch++

    if (epoch > totalEpochs) {
      emit({ type: 'training_complete', step, epoch: epoch - 1, final_model: `epoch${epoch - 1}` })
      console.log('\n\nTraining complete!')
      clearInterval(interval)
    }
  }
}, 500)
