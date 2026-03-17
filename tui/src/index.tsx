import React from 'react'
import { render } from 'ink'
import { App } from './components/App.js'

const eventsFile = process.argv[2]
if (!eventsFile) {
  console.error('Usage: tsx src/index.tsx <path-to-events.jsonl>')
  process.exit(1)
}

render(<App eventsFile={eventsFile} />)
