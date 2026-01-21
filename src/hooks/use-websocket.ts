import { useEffect, useRef, useCallback, useState } from 'react'
import type { ClientMessage, ServerMessage, UserPresence, CursorPosition } from '@/server/websocket/types'

interface UseWebSocketOptions {
  boardId: string
  token: string | null
  onUserJoined?: (user: UserPresence) => void
  onUserLeft?: (odId: string) => void
  onCursorUpdate?: (odId: string, position: CursorPosition) => void
  onObjectAdded?: (odId: string, userId: string, objectId: string, objectData: object) => void
  onObjectModified?: (odId: string, userId: string, objectId: string, objectData: object) => void
  onObjectRemoved?: (odId: string, userId: string, objectId: string) => void
  onCanvasCleared?: (odId: string, userId: string) => void
  onSyncResponse?: (canvasData: object) => void
  onError?: (message: string) => void
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
const RECONNECT_DELAY = 3000
const MAX_RECONNECT_ATTEMPTS = 5

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    boardId,
    token,
    onUserJoined,
    onUserLeft,
    onCursorUpdate,
    onObjectAdded,
    onObjectModified,
    onObjectRemoved,
    onCanvasCleared,
    onSyncResponse,
    onError,
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<UserPresence[]>([])
  const [myUserId, setMyUserId] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (!token || !boardId) return

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
      reconnectAttemptsRef.current = 0

      // Send join message
      const joinMessage: ClientMessage = {
        type: 'join',
        boardId,
        token,
      }
      ws.send(JSON.stringify(joinMessage))
    }

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data)

        switch (message.type) {
          case 'joined':
            setIsConnected(true)
            setMyUserId(message.userId)
            setUsers(message.users)
            break

          case 'error':
            onError?.(message.message)
            break

          case 'user_joined':
            setUsers((prev) => [...prev, message.user])
            onUserJoined?.(message.user)
            break

          case 'user_left':
            setUsers((prev) => prev.filter((u) => u.odId !== message.odId))
            onUserLeft?.(message.odId)
            break

          case 'cursor_update':
            setUsers((prev) =>
              prev.map((u) =>
                u.odId === message.odId ? { ...u, cursor: message.position } : u
              )
            )
            onCursorUpdate?.(message.odId, message.position)
            break

          case 'object_added':
            onObjectAdded?.(message.odId, message.userId, message.objectId, message.objectData)
            break

          case 'object_modified':
            onObjectModified?.(message.odId, message.userId, message.objectId, message.objectData)
            break

          case 'object_removed':
            onObjectRemoved?.(message.odId, message.userId, message.objectId)
            break

          case 'canvas_cleared':
            onCanvasCleared?.(message.odId, message.userId)
            break

          case 'sync_response':
            onSyncResponse?.(message.canvasData)
            break
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      wsRef.current = null

      // Attempt reconnect
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++
        console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`)
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }, [boardId, token, onUserJoined, onUserLeft, onCursorUpdate, onObjectAdded, onObjectModified, onObjectRemoved, onCanvasCleared, onSyncResponse, onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      const leaveMessage: ClientMessage = { type: 'leave' }
      wsRef.current.send(JSON.stringify(leaveMessage))
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
    setUsers([])
    setMyUserId(null)
  }, [])

  const sendCursorMove = useCallback((position: CursorPosition) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: ClientMessage = { type: 'cursor_move', position }
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const sendObjectAdded = useCallback((objectId: string, objectData: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: ClientMessage = { type: 'object_added', objectId, objectData }
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const sendObjectModified = useCallback((objectId: string, objectData: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: ClientMessage = { type: 'object_modified', objectId, objectData }
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const sendObjectRemoved = useCallback((objectId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: ClientMessage = { type: 'object_removed', objectId }
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const sendCanvasClear = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: ClientMessage = { type: 'canvas_clear' }
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const requestSync = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: ClientMessage = { type: 'sync_request' }
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  // Connect when token and boardId are available
  useEffect(() => {
    if (token && boardId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [token, boardId, connect, disconnect])

  return {
    isConnected,
    users,
    myUserId,
    connect,
    disconnect,
    sendCursorMove,
    sendObjectAdded,
    sendObjectModified,
    sendObjectRemoved,
    sendCanvasClear,
    requestSync,
  }
}
