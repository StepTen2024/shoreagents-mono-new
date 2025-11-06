"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: number
  emit: (event: string, data: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: 0,
  emit: () => {},
  on: () => {},
  off: () => {},
})

export const useWebSocket = () => useContext(WebSocketContext)

interface WebSocketProviderProps {
  children: ReactNode
  userId?: string
  userName?: string
}

export function WebSocketProvider({ children, userId, userName }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)

  useEffect(() => {
    // Initialize Socket.IO client
    const socketInstance = io('http://localhost:3000', {
      path: '/api/socketio',
      addTrailingSlash: false,
      autoConnect: true,   
    })

    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected to server')
      setIsConnected(true)
      
      // Identify user if credentials provided
      if (userId && userName) {
        socketInstance.emit('identify', { userId, userName })
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from server')
      setIsConnected(false)
    })

    socketInstance.on('users:online', (data) => {
      console.log('[WebSocket] Online users:', data.count)
      setOnlineUsers(data.count)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error)
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [userId, userName])

  const emit = (event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn('[WebSocket] Cannot emit, socket not connected')
    }
  }

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback)
      } else {
        socket.off(event)
      }
    }
  }

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, onlineUsers, emit, on, off }}>
      {children}
    </WebSocketContext.Provider>
  )
}
