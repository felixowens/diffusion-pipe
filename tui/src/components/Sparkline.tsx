import React from 'react'
import { Text } from 'ink'

const BARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

type Props = {
  values: number[]
  width?: number
  color?: string
}

export function Sparkline({ values, width = 20, color = 'yellow' }: Props) {
  if (values.length === 0) return <Text color="gray">{' '.repeat(width)}</Text>

  // Take the last `width` values
  const slice = values.slice(-width)
  const min = Math.min(...slice)
  const max = Math.max(...slice)
  const range = max - min || 1

  const bars = slice.map((v) => {
    const normalized = (v - min) / range
    const idx = Math.min(Math.floor(normalized * (BARS.length - 1)), BARS.length - 1)
    return BARS[idx]
  })

  // Pad left if fewer values than width
  const pad = ' '.repeat(Math.max(0, width - bars.length))

  return (
    <Text color={color}>
      {pad}
      {bars.join('')}
    </Text>
  )
}
