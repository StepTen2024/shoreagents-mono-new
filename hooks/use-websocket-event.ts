"use client"

import { useEffect } from 'react'
import { useWebSocket } from '@/lib/websocket-provider'

/**
 * Custom hook to listen to WebSocket events
 * Automatically handles cleanup on unmount
 */
export function useWebSocketEvent(event: string, callback: (data: any) => void) {
  const { on, off, isConnected } = useWebSocket()

  useEffect(() => {
    if (!isConnected) return

    on(event, callback)

    return () => {
      off(event, callback)
    }
  }, [event, callback, on, off, isConnected])
}

/**
 * Custom hook to emit WebSocket events
 */
export function useWebSocketEmit() {
  const { emit, isConnected } = useWebSocket()

  return {
    emit,
    isConnected,
  }
}
