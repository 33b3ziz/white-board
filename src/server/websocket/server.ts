import { WebSocketServer, WebSocket } from 'ws'
import { db } from '@/db/index'
import { sessions, users, boards } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import type { ClientMessage, ServerMessage, UserPresence } from './types'
import { getRandomUserColor } from './types'

interface Client {
  ws: WebSocket
  odId: string
  userId: string
  displayName: string
  avatarUrl?: string
  color: string
  boardId: string
  cursor?: { x: number; y: number }
  lastSeen: number
}

// Map of boardId -> Map of odId -> Client
const boards_clients = new Map<string, Map<string, Client>>()

async function verifyToken(token: string): Promise<{ userId: string; displayName: string; avatarUrl?: string } | null> {
  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1)

    if (!session) return null

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user) return null

    return {
      userId: user.id,
      displayName: user.displayName || user.email.split('@')[0],
      avatarUrl: user.avatarUrl || undefined,
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

function broadcast(boardId: string, message: ServerMessage, excludeOdId?: string) {
  const clients = boards_clients.get(boardId)
  if (!clients) return

  const data = JSON.stringify(message)
  clients.forEach((client, odId) => {
    if (odId !== excludeOdId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data)
    }
  })
}

function sendToClient(client: Client, message: ServerMessage) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message))
  }
}

function getPresenceList(boardId: string): UserPresence[] {
  const clients = boards_clients.get(boardId)
  if (!clients) return []

  return Array.from(clients.values()).map((c) => ({
    odId: c.odId,
    userId: c.userId,
    displayName: c.displayName,
    avatarUrl: c.avatarUrl,
    color: c.color,
    cursor: c.cursor,
    lastSeen: c.lastSeen,
  }))
}

function handleMessage(client: Client, message: ClientMessage) {
  client.lastSeen = Date.now()

  switch (message.type) {
    case 'cursor_move':
      client.cursor = message.position
      broadcast(client.boardId, {
        type: 'cursor_update',
        odId: client.odId,
        position: message.position,
      }, client.odId)
      break

    case 'object_added':
      broadcast(client.boardId, {
        type: 'object_added',
        odId: client.odId,
        userId: client.userId,
        objectId: message.objectId,
        objectData: message.objectData,
      }, client.odId)
      break

    case 'object_modified':
      broadcast(client.boardId, {
        type: 'object_modified',
        odId: client.odId,
        userId: client.userId,
        objectId: message.objectId,
        objectData: message.objectData,
      }, client.odId)
      break

    case 'object_removed':
      broadcast(client.boardId, {
        type: 'object_removed',
        odId: client.odId,
        userId: client.userId,
        objectId: message.objectId,
      }, client.odId)
      break

    case 'canvas_clear':
      broadcast(client.boardId, {
        type: 'canvas_cleared',
        odId: client.odId,
        userId: client.userId,
      }, client.odId)
      break

    case 'sync_request':
      // Get canvas data from database and send it
      db.select()
        .from(boards)
        .where(eq(boards.id, client.boardId))
        .limit(1)
        .then(([board]) => {
          if (board?.canvasData) {
            sendToClient(client, {
              type: 'sync_response',
              canvasData: board.canvasData as object,
            })
          }
        })
        .catch(console.error)
      break
  }
}

function handleDisconnect(client: Client) {
  const clients = boards_clients.get(client.boardId)
  if (clients) {
    clients.delete(client.odId)
    if (clients.size === 0) {
      boards_clients.delete(client.boardId)
    } else {
      broadcast(client.boardId, {
        type: 'user_left',
        odId: client.odId,
      })
    }
  }
}

export function createWebSocketServer(port: number = 3001) {
  const wss = new WebSocketServer({ port })

  console.log(`WebSocket server running on ws://localhost:${port}`)

  wss.on('connection', (ws) => {
    let client: Client | null = null
    const odId = crypto.randomUUID()

    ws.on('message', async (data) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString())

        // Handle join message (authentication required)
        if (message.type === 'join') {
          const user = await verifyToken(message.token)
          if (!user) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired token' }))
            ws.close()
            return
          }

          // Check if user has access to board
          const [board] = await db
            .select()
            .from(boards)
            .where(eq(boards.id, message.boardId))
            .limit(1)

          if (!board) {
            ws.send(JSON.stringify({ type: 'error', message: 'Board not found' }))
            ws.close()
            return
          }

          // Create client
          client = {
            ws,
            odId,
            userId: user.userId,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            color: getRandomUserColor(),
            boardId: message.boardId,
            lastSeen: Date.now(),
          }

          // Add to board clients
          if (!boards_clients.has(message.boardId)) {
            boards_clients.set(message.boardId, new Map())
          }
          boards_clients.get(message.boardId)!.set(odId, client)

          // Send joined confirmation with current users
          sendToClient(client, {
            type: 'joined',
            boardId: message.boardId,
            userId: user.userId,
            users: getPresenceList(message.boardId),
          })

          // Broadcast user joined to others
          broadcast(message.boardId, {
            type: 'user_joined',
            user: {
              odId,
              userId: user.userId,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              color: client.color,
              lastSeen: client.lastSeen,
            },
          }, odId)

          return
        }

        // Handle leave message
        if (message.type === 'leave') {
          if (client) {
            handleDisconnect(client)
            client = null
          }
          return
        }

        // All other messages require an active client
        if (!client) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not joined to a board' }))
          return
        }

        handleMessage(client, message)
      } catch (error) {
        console.error('WebSocket message error:', error)
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
      }
    })

    ws.on('close', () => {
      if (client) {
        handleDisconnect(client)
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      if (client) {
        handleDisconnect(client)
      }
    })
  })

  return wss
}

// Run server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createWebSocketServer()
}
