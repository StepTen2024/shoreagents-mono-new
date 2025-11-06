import { Server as SocketIOServer } from "socket.io"

// Global socket server instance
let io: SocketIOServer | null = null

export function setSocketServer(server: SocketIOServer) {
  io = server
  console.log("✅ Socket server instance registered")
}

export function getSocketServer(): SocketIOServer | null {
  return io
}

// Helper to emit to a specific user
export function emitToUser(userId: string, event: string, data: any) {
  if (!io) {
    console.warn("❌ Socket server not initialized")
    return false
  }
  
  // Emit to user's room (users join a room with their userId)
  io.to(`user:${userId}`).emit(event, data)
  console.log(`📤 Emitted ${event} to user ${userId}:`, data)
  return true
}

// Helper to broadcast to all users
export function broadcast(event: string, data: any) {
  if (!io) {
    console.warn("❌ Socket server not initialized")
    return false
  }
  
  io.emit(event, data)
  console.log(`📢 Broadcast ${event}:`, data)
  return true
}

