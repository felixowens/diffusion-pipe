#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "=== Python: EventLogger unit tests ==="
PYTHONPATH=. python3 test/test_event_logger.py

echo ""
echo "=== Contract: Python writes → TypeScript validates ==="
PYTHONPATH=. python3 test/generate_test_events.py /tmp/diffusion-pipe-contract-test/events.jsonl
cd tui && pnpm exec tsx src/test-contract.ts /tmp/diffusion-pipe-contract-test/events.jsonl

echo ""
echo "All tests passed."
