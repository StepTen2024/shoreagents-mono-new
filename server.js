/**
 * Custom Next.js Server with Socket.IO
 * This server handles both Next.js pages and WebSocket connections
 */

// ⚡ CRITICAL: Load environment variables from .env.local FIRST!
require('dotenv').config({ path: '.env.local' })

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

// Fix EventEmitter memory leak warning
require('events').EventEmitter.defaultMaxListeners = 15;

// Initialize Prisma Client
const prisma = new PrismaClient()

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Check for --turbo flag
const useTurbo = process.argv.includes('--turbo')

if (useTurbo) {
  console.log('🚀 Turbopack enabled for faster development builds!')
}

const app = next({ 
  dev, 
  hostname, 
  port,
  ...(useTurbo && { turbo: true })
})
const handle = app.getRequestHandler()

// Global socket server for API routes
global.socketServer = null

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: dev ? ['http://localhost:3000'] : false,
      methods: ['GET', 'POST']
    },
  })

  // Make socket server globally accessible
  global.socketServer = io
  console.log('✅ Socket server registered globally')

  // Store connected users
  const connectedUsers = new Map()

  // Function to emit performance updates to monitoring clients
  const emitPerformanceUpdate = (data) => {
    console.log('[WebSocket] Emitting performance update to monitoring clients:', data)
    io.to('monitoring').emit('monitoring:performance-update', data)
  }

  // Make emitPerformanceUpdate available globally
  global.emitPerformanceUpdate = emitPerformanceUpdate

  io.on('connection', (socket) => {
    console.log('[WebSocket] Client connected:', socket.id)

    // Handle user authentication/identification
    socket.on('identify', (data) => {
      const { userId, userName } = data
      connectedUsers.set(socket.id, { userId, userName, socketId: socket.id })
      console.log('[WebSocket] User identified:', userName, 'UserID:', userId)
      
      // Have user join their own room for targeted messages
      socket.join(`user:${userId}`)
      console.log(`[WebSocket] User ${userName} joined room: user:${userId}`)
      
      // Broadcast online users count
      io.emit('users:online', {
        count: connectedUsers.size,
        users: Array.from(connectedUsers.values())
      })
    })

    // Break events
    socket.on('break:start', (data) => {
      console.log('[WebSocket] Break start event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('break:started', data)
    })

    socket.on('break:end', (data) => {
      console.log('[WebSocket] Break end event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('break:ended', data)
    })

    socket.on('break:pause', (data) => {
      console.log('[WebSocket] Break pause event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('break:paused', data)
    })

    socket.on('break:resume', (data) => {
      console.log('[WebSocket] Break resume event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('break:resumed', data)
    })

    // Task events
    socket.on('task:create', (data) => {
      console.log('[WebSocket] Task created:', data)
      io.emit('task:created', data)
    })

    socket.on('task:update', (data) => {
      console.log('[WebSocket] Task updated:', data)
      io.emit('task:updated', data)
    })

    socket.on('task:delete', (data) => {
      console.log('[WebSocket] Task deleted:', data)
      io.emit('task:deleted', data)
    })

    // Time tracking events - just broadcast, client handles API calls
    socket.on('time:clockin', (data) => {
      console.log('[WebSocket] Clock in event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('time:clockedin', data)
    })

    socket.on('time:clockout', (data) => {
      console.log('[WebSocket] Clock out event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('time:clockedout', data)
    })

    // Data update events - broadcast when data changes
    socket.on('time:data-update', (data) => {
      console.log('[WebSocket] Time data update:', data)
      // Broadcast to all clients for real-time updates
      io.emit('time:data-updated', data)
    })

    // Performance metrics events
    socket.on('metrics:update', (data) => {
      // Only send to the specific user
      socket.emit('metrics:updated', data)
    })

    // Performance monitoring events for clients
    socket.on('monitoring:subscribe', (data) => {
      console.log('[WebSocket] Client subscribed to monitoring updates:', data)
      // Join a monitoring room for this client
      socket.join('monitoring')
    })

    socket.on('monitoring:unsubscribe', () => {
      console.log('[WebSocket] Client unsubscribed from monitoring updates')
      socket.leave('monitoring')
    })

    // Force refresh event for monitoring clients
    socket.on('monitoring:force-refresh', () => {
      console.log('[WebSocket] Force refresh requested')
      io.to('monitoring').emit('monitoring:refresh-requested')
    })

    // Activity feed events
    socket.on('post:create', (data) => {
      console.log('[WebSocket] Post created:', data)
      io.emit('post:created', data)
    })

    socket.on('post:react', (data) => {
      console.log('[WebSocket] Post reaction:', data)
      io.emit('post:reacted', data)
    })

    socket.on('post:comment', (data) => {
      console.log('[WebSocket] Post comment:', data)
      io.emit('post:commented', data)
    })

    // Ticket events
    socket.on('ticket:create', (data) => {
      console.log('[WebSocket] Ticket created:', data)
      io.emit('ticket:created', data)
    })

    socket.on('ticket:update', (data) => {
      console.log('[WebSocket] Ticket updated:', data)
      io.emit('ticket:updated', data)
    })

    socket.on('ticket:respond', (data) => {
      console.log('[WebSocket] Ticket response:', data)
      io.emit('ticket:responded', data)
    })

    // Leaderboard events
    socket.on('leaderboard:update', (data) => {
      io.emit('leaderboard:updated', data)
    })

    // Notification events
    socket.on('notification:send', (data) => {
      console.log('[WebSocket] Notification:', data)
      // Send to specific user or broadcast
      if (data.userId) {
        // Find the socket for this user
        const userSocket = Array.from(connectedUsers.entries())
          .find(([_, user]) => user.userId === data.userId)
        if (userSocket) {
          io.to(userSocket[0]).emit('notification:received', data)
        }
      } else {
        io.emit('notification:received', data)
      }
    })

    // Video call events
    socket.on('call:invite', (data) => {
      console.log('[WebSocket] Call invitation:', data)
      // Send call invitation to specific staff member
      const staffSocket = Array.from(connectedUsers.entries())
        .find(([_, user]) => user.userId === data.staffId)
      
      if (staffSocket) {
        io.to(staffSocket[0]).emit('call:incoming', {
          roomUrl: data.roomUrl,
          callerName: data.callerName,
          callerId: data.callerId,
          timestamp: Date.now()
        })
        console.log(`[WebSocket] Call sent to staff: ${data.staffId}`)
      } else {
        console.log(`[WebSocket] Staff not connected: ${data.staffId}`)
      }
    })

    socket.on('call:accept', (data) => {
      console.log('[WebSocket] Call accepted:', data)
      // Notify caller that staff accepted
      const callerSocket = Array.from(connectedUsers.entries())
        .find(([_, user]) => user.userId === data.callerId)
      
      if (callerSocket) {
        io.to(callerSocket[0]).emit('call:accepted', {
          staffId: data.staffId,
          staffName: data.staffName
        })
      }
    })

    socket.on('call:reject', (data) => {
      console.log('[WebSocket] Call rejected:', data)
      // Notify caller that staff rejected
      const callerSocket = Array.from(connectedUsers.entries())
        .find(([_, user]) => user.userId === data.callerId)
      
      if (callerSocket) {
        io.to(callerSocket[0]).emit('call:rejected', {
          staffId: data.staffId,
          staffName: data.staffName
        })
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id)
      console.log('[WebSocket] Client disconnected:', user?.userName || socket.id)
      connectedUsers.delete(socket.id)
      
      // Broadcast updated online users
      io.emit('users:online', {
        count: connectedUsers.size,
        users: Array.from(connectedUsers.values())
      })
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> WebSocket server ready on ws://${hostname}:${port}/api/socketio`)
      
      // Start break auto-start background job
      startBreakAutoStartJob(io)
    })
})

/**
 * Background job to auto-start scheduled breaks
 * Checks every minute if any breaks should start
 */
function startBreakAutoStartJob(io) {
  console.log('[Break Auto-Start] Background job started')
  
  // Helper function to parse time strings like "1:45 PM"
  const parseTimeString = (timeStr) => {
    try {
      const [time, period] = timeStr.trim().split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      const minute = parseInt(minutes || '0')
      
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      return { hour, minute }
    } catch (error) {
      console.error('[Break Auto-Start] Error parsing time:', timeStr, error)
      return null
    }
  }
  
  // Check every minute
  setInterval(async () => {
    try {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      // Find all clocked-in users
      const activeEntries = await prisma.time_entries.findMany({
        where: {
          clockOut: null
        },
        select: {
          id: true,
          staffUserId: true,
          clockIn: true
        }
      })
      
      if (activeEntries.length === 0) return
      
      console.log(`[Break Auto-Start] Checking ${activeEntries.length} active sessions`)
      
      // For each active session, check scheduled breaks
      for (const entry of activeEntries) {
        // Get scheduled breaks for this time entry
        const scheduledBreaks = await prisma.breaks.findMany({
          where: {
            timeEntryId: entry.id,
            actualStart: null, // Not started yet
            actualEnd: null    // Not ended
          }
        })
        
        for (const breakItem of scheduledBreaks) {
          if (!breakItem.scheduledStart) continue
          
          const scheduledTime = parseTimeString(breakItem.scheduledStart)
          if (!scheduledTime) continue
          
          // Check if it's time to start this break (within 1 minute window)
          if (scheduledTime.hour === currentHour && scheduledTime.minute === currentMinute) {
            console.log(`[Break Auto-Start] Time to start break ${breakItem.type} for user ${entry.staffUserId}`)
            
            // Emit WebSocket event to trigger break modal
            io.emit('break:auto-start-trigger', {
              staffUserId: entry.staffUserId,
              breakId: breakItem.id,
              breakType: breakItem.type,
              scheduledStart: breakItem.scheduledStart,
              duration: breakItem.duration,
              timeEntryId: entry.id
            })
          }
        }
      }
    } catch (error) {
      console.error('[Break Auto-Start] Error checking breaks:', error)
    }
  }, 60000) // Check every minute
}
