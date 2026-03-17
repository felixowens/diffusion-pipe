"""Generate a test events.jsonl file with all event types.
Used as input for the TypeScript contract test."""

import sys
sys.path.insert(0, '.')

from utils.event_logger import EventLogger
import tempfile

output = sys.argv[1] if len(sys.argv) > 1 else '/tmp/diffusion-pipe-test-events/events.jsonl'

import os
os.makedirs(os.path.dirname(output), exist_ok=True)

# EventLogger expects a directory
dir_path = os.path.dirname(output)
logger = EventLogger(dir_path)

# training_start
logger.log({
    'type': 'training_start',
    'model_type': 'anima',
    'dataset': '/data/my-dataset/dataset.toml',
    'epochs': 5,
    'steps_per_epoch': 200,
    'save_every_n_steps': None,
    'save_every_n_epochs': 1,
    'checkpoint_every_n_minutes': 30,
    'adapter': {'type': 'lora', 'rank': 16},
    'optimizer': {'type': 'adamw_optimi', 'lr': 5e-5, 'betas': [0.9, 0.99]},
    'global_batch_size': 4,
    'run_dir': '/output/20260315_18-00-00',
})

# log
logger.log({'type': 'log', 'level': 'info', 'message': 'Training started'})

# steps with and without grad_norm
logger.log({'type': 'step', 'step': 1, 'epoch': 1, 'loss': 0.15, 'examples': 4, 'grad_norm': 1.23})
logger.log({'type': 'step', 'step': 2, 'epoch': 1, 'loss': 0.14, 'examples': 8})
logger.log({'type': 'step', 'step': 3, 'epoch': 1, 'loss': 0.13, 'examples': 12, 'grad_norm': 0.95})

# eval
logger.log({
    'type': 'eval',
    'step': 50,
    'name': 'eval0',
    'avg_loss': 0.12,
    'quantile_losses': {
        'q0.10': 0.08, 'q0.20': 0.09, 'q0.30': 0.10,
        'q0.40': 0.11, 'q0.50': 0.12, 'q0.60': 0.13,
        'q0.70': 0.14, 'q0.80': 0.15, 'q0.90': 0.16,
    },
})

# epoch
logger.log({'type': 'epoch', 'epoch': 1, 'epoch_loss': 0.12})

# checkpoint
logger.log({'type': 'checkpoint', 'step': 200, 'epoch': 1})

# save
logger.log({'type': 'save', 'step': 200, 'name': 'epoch1'})

# log with different levels
logger.log({'type': 'log', 'level': 'info', 'message': 'Epoch 1 complete — loss 0.1200'})
logger.log({'type': 'log', 'level': 'warn', 'message': 'High gradient norm: 5.23'})
logger.log({'type': 'log', 'level': 'error', 'message': 'CUDA OOM on batch 42'})

# training_complete
logger.log({'type': 'training_complete', 'step': 1000, 'epoch': 5, 'final_model': 'epoch5'})

logger.close()
print(f'Wrote {output}')
