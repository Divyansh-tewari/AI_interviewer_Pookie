'use client'

import { useEffect, useState } from 'react'

interface TimerProps {
  startedAt: string
  timerMinutes: number
  onExpire: () => void
}

export function Timer({ startedAt, timerMinutes, onExpire }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    return Math.max(0, timerMinutes * 60 - elapsed)
  })

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire()
      return
    }
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          onExpire()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, []) // run once on mount

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const isLow = secondsLeft < 300 // < 5 minutes

  return (
    <div
      className={`font-mono text-sm tabular-nums ${
        isLow ? 'text-red-400' : 'text-zinc-400'
      }`}
    >
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  )
}
