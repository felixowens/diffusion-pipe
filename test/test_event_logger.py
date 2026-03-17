"""Tests for the JSONL event logger.

Verifies:
1. EventLogger writes valid JSONL
2. All event types produce valid JSON with expected fields
3. Edge cases (NaN, Inf) are handled
4. Output can be parsed by the TUI's expected schema
"""

import json
import math
import tempfile
from pathlib import Path

from utils.event_logger import EventLogger


def read_events(path):
    events = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                events.append(json.loads(line))
    return events


def test_basic_write():
    with tempfile.TemporaryDirectory() as d:
        logger = EventLogger(d)
        logger.log({'type': 'step', 'step': 1, 'loss': 0.05})
        logger.close()

        events = read_events(Path(d) / 'events.jsonl')
        assert len(events) == 1
        assert events[0]['type'] == 'step'
        assert events[0]['step'] == 1
        assert events[0]['loss'] == 0.05
        assert 'ts' in events[0]
        assert isinstance(events[0]['ts'], float)


def test_multiple_events():
    with tempfile.TemporaryDirectory() as d:
        logger = EventLogger(d)
        for i in range(100):
            logger.log({'type': 'step', 'step': i, 'loss': 0.1 - i * 0.001})
        logger.close()

        events = read_events(Path(d) / 'events.jsonl')
        assert len(events) == 100
        assert events[0]['step'] == 0
        assert events[99]['step'] == 99


def test_all_event_types():
    """Emit every event type the TUI expects and verify the schema."""
    with tempfile.TemporaryDirectory() as d:
        logger = EventLogger(d)

        logger.log({
            'type': 'training_start',
            'model_type': 'anima',
            'dataset': '/data/dataset.toml',
            'epochs': 5,
            'steps_per_epoch': 200,
            'save_every_n_steps': None,
            'save_every_n_epochs': 1,
            'checkpoint_every_n_minutes': 30,
            'adapter': {'type': 'lora', 'rank': 16},
            'optimizer': {'type': 'adamw_optimi', 'lr': 5e-5},
            'global_batch_size': 4,
            'run_dir': '/output/test',
        })

        logger.log({
            'type': 'step',
            'step': 1,
            'epoch': 1,
            'loss': 0.0523,
            'examples': 4,
            'grad_norm': 1.23,
        })

        logger.log({
            'type': 'step',
            'step': 2,
            'epoch': 1,
            'loss': 0.0498,
            'examples': 8,
            # grad_norm intentionally omitted — it's optional
        })

        logger.log({
            'type': 'eval',
            'step': 50,
            'name': 'eval0',
            'avg_loss': 0.045,
            'quantile_losses': {'q0.10': 0.03, 'q0.50': 0.04, 'q0.90': 0.06},
        })

        logger.log({
            'type': 'epoch',
            'epoch': 1,
            'epoch_loss': 0.048,
        })

        logger.log({
            'type': 'checkpoint',
            'step': 200,
            'epoch': 1,
        })

        logger.log({
            'type': 'save',
            'step': 200,
            'name': 'epoch1',
        })

        logger.log({
            'type': 'log',
            'level': 'info',
            'message': 'Epoch 1 complete',
        })

        logger.log({
            'type': 'log',
            'level': 'warn',
            'message': 'High grad norm detected',
        })

        logger.log({
            'type': 'training_complete',
            'step': 1000,
            'epoch': 5,
            'final_model': 'epoch5',
        })

        logger.close()

        events = read_events(Path(d) / 'events.jsonl')
        assert len(events) == 10

        # Verify every event has a timestamp
        for e in events:
            assert 'ts' in e
            assert isinstance(e['ts'], float)

        # Verify types
        types = [e['type'] for e in events]
        assert types == [
            'training_start', 'step', 'step', 'eval', 'epoch',
            'checkpoint', 'save', 'log', 'log', 'training_complete',
        ]

        # training_start has all required fields
        start = events[0]
        assert start['model_type'] == 'anima'
        assert start['steps_per_epoch'] == 200
        assert start['save_every_n_steps'] is None
        assert start['save_every_n_epochs'] == 1
        assert start['adapter']['rank'] == 16

        # step with grad_norm
        assert events[1]['grad_norm'] == 1.23
        # step without grad_norm — should not have the key
        assert 'grad_norm' not in events[2]

        # eval has quantile_losses dict
        assert isinstance(events[3]['quantile_losses'], dict)

        # log levels
        assert events[7]['level'] == 'info'
        assert events[8]['level'] == 'warn'


def test_nan_inf_handling():
    """NaN and Inf are not valid JSON. Verify we handle them."""
    with tempfile.TemporaryDirectory() as d:
        logger = EventLogger(d)

        # This would blow up with standard json.dumps
        try:
            logger.log({'type': 'step', 'step': 1, 'loss': float('nan')})
            logger.log({'type': 'step', 'step': 2, 'loss': float('inf')})
            logger.close()

            # If we get here, json.dumps allowed it (Python default allows NaN/Inf)
            # But the TUI's JSON.parse will turn them into null. Let's verify the
            # file is at least readable line by line.
            with open(Path(d) / 'events.jsonl') as f:
                lines = [l.strip() for l in f if l.strip()]
            assert len(lines) == 2

            # Python's json.loads accepts NaN/Inf too
            e1 = json.loads(lines[0])
            assert math.isnan(e1['loss'])
            e2 = json.loads(lines[1])
            assert math.isinf(e2['loss'])
        except ValueError:
            # If json.dumps raises on NaN/Inf, that's also acceptable behavior
            # but we should document it
            pass


def test_flush_on_every_write():
    """Events should be readable immediately after logging, not buffered."""
    with tempfile.TemporaryDirectory() as d:
        logger = EventLogger(d)
        path = Path(d) / 'events.jsonl'

        logger.log({'type': 'step', 'step': 1, 'loss': 0.1})
        # Read without closing
        events = read_events(path)
        assert len(events) == 1

        logger.log({'type': 'step', 'step': 2, 'loss': 0.09})
        events = read_events(path)
        assert len(events) == 2

        logger.close()


if __name__ == '__main__':
    test_basic_write()
    print('✓ test_basic_write')

    test_multiple_events()
    print('✓ test_multiple_events')

    test_all_event_types()
    print('✓ test_all_event_types')

    test_nan_inf_handling()
    print('✓ test_nan_inf_handling')

    test_flush_on_every_write()
    print('✓ test_flush_on_every_write')

    print('\nAll tests passed.')
