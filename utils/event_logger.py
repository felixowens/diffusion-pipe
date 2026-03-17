import json
import time
from pathlib import Path


class EventLogger:
    def __init__(self, run_dir: str):
        self.path = Path(run_dir) / 'events.jsonl'
        self._file = open(self.path, 'a')

    def log(self, event: dict):
        event['ts'] = time.time()
        self._file.write(json.dumps(event) + '\n')
        self._file.flush()

    def close(self):
        self._file.close()
