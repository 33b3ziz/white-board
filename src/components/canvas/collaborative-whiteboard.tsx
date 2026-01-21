import { useEffect, useCallback, useRef } from 'react'
import { Whiteboard } from './whiteboard'
import { RemoteCursors } from '@/components/collaboration/remote-cursors'
import { useWebSocket } from '@/hooks/use-websocket'
import { useAuthStore } from '@/stores/auth-store'
import { useCanvasStore } from '@/stores/canvas-store'
import { useCollaborationStore } from '@/stores/collaboration-store'
import type { FabricObject } from 'fabric'

interface CollaborativeWhiteboardProps {
  boardId: string
}

export function CollaborativeWhiteboard({ boardId }: CollaborativeWhiteboardProps) {
  const token = useAuthStore((state) => state.token)
  const canvas = useCanvasStore((state) => state.canvas)
  const setConnected = useCollaborationStore((state) => state.setConnected)
  const setUsers = useCollaborationStore((state) => state.setUsers)
  const setMyUserId = useCollaborationStore((state) => state.setMyUserId)
  const addUser = useCollaborationStore((state) => state.addUser)
  const removeUser = useCollaborationStore((state) => state.removeUser)
  const updateCursor = useCollaborationStore((state) => state.updateCursor)

  // Track objects being modified remotely to avoid echo
  const remoteUpdatesRef = useRef<Set<string>>(new Set())

  // Handle remote object added
  const handleObjectAdded = useCallback(
    (_odId: string, _userId: string, objectId: string, objectData: object) => {
      if (!canvas) return

      remoteUpdatesRef.current.add(objectId)

      // Deserialize and add object to canvas
      canvas.loadFromJSON({ objects: [objectData], version: '6.0.0' }, () => {
        canvas.requestRenderAll()
        setTimeout(() => remoteUpdatesRef.current.delete(objectId), 100)
      })
    },
    [canvas]
  )

  // Handle remote object modified
  const handleObjectModified = useCallback(
    (_odId: string, _userId: string, objectId: string, objectData: object) => {
      if (!canvas) return

      remoteUpdatesRef.current.add(objectId)

      // Find and update the object
      const objects = canvas.getObjects()
      const obj = objects.find((o: FabricObject) => (o as any).id === objectId)

      if (obj) {
        obj.set(objectData as any)
        canvas.requestRenderAll()
      }

      setTimeout(() => remoteUpdatesRef.current.delete(objectId), 100)
    },
    [canvas]
  )

  // Handle remote object removed
  const handleObjectRemoved = useCallback(
    (_odId: string, _userId: string, objectId: string) => {
      if (!canvas) return

      remoteUpdatesRef.current.add(objectId)

      const objects = canvas.getObjects()
      const obj = objects.find((o: FabricObject) => (o as any).id === objectId)

      if (obj) {
        canvas.remove(obj)
        canvas.requestRenderAll()
      }

      setTimeout(() => remoteUpdatesRef.current.delete(objectId), 100)
    },
    [canvas]
  )

  // Handle canvas cleared remotely
  const handleCanvasCleared = useCallback(
    (_odId: string, _userId: string) => {
      if (!canvas) return
      canvas.clear()
      canvas.requestRenderAll()
    },
    [canvas]
  )

  // Handle sync response
  const handleSyncResponse = useCallback(
    (canvasData: object) => {
      if (!canvas) return
      canvas.loadFromJSON(canvasData, () => {
        canvas.requestRenderAll()
      })
    },
    [canvas]
  )

  // Initialize WebSocket
  const {
    isConnected,
    users,
    myUserId,
    sendCursorMove,
    sendObjectAdded,
    sendObjectModified,
    sendObjectRemoved,
    sendCanvasClear,
    requestSync,
  } = useWebSocket({
    boardId,
    token,
    onUserJoined: addUser,
    onUserLeft: removeUser,
    onCursorUpdate: updateCursor,
    onObjectAdded: handleObjectAdded,
    onObjectModified: handleObjectModified,
    onObjectRemoved: handleObjectRemoved,
    onCanvasCleared: handleCanvasCleared,
    onSyncResponse: handleSyncResponse,
    onError: (message) => console.error('WebSocket error:', message),
  })

  // Update collaboration store when connection state changes
  useEffect(() => {
    setConnected(isConnected)
    setUsers(users)
    setMyUserId(myUserId)
  }, [isConnected, users, myUserId, setConnected, setUsers, setMyUserId])

  // Request sync when connected
  useEffect(() => {
    if (isConnected && canvas) {
      requestSync()
    }
  }, [isConnected, canvas, requestSync])

  // Set up canvas event listeners for collaboration
  useEffect(() => {
    if (!canvas || !isConnected) return

    // Track mouse movement for cursor sharing
    const handleMouseMove = (e: any) => {
      const pointer = canvas.getScenePoint(e.e)
      sendCursorMove({ x: pointer.x, y: pointer.y })
    }

    // Track object additions
    const handleObjectAdded = (e: any) => {
      const obj = e.target as FabricObject
      if (!obj || remoteUpdatesRef.current.has((obj as any).id)) return

      // Assign an ID if not present
      if (!(obj as any).id) {
        (obj as any).id = crypto.randomUUID()
      }

      sendObjectAdded((obj as any).id, obj.toObject(['id']))
    }

    // Track object modifications
    const handleObjectModified = (e: any) => {
      const obj = e.target as FabricObject
      if (!obj || remoteUpdatesRef.current.has((obj as any).id)) return

      if ((obj as any).id) {
        sendObjectModified((obj as any).id, obj.toObject(['id']))
      }
    }

    // Track object removals
    const handleObjectRemoved = (e: any) => {
      const obj = e.target as FabricObject
      if (!obj || remoteUpdatesRef.current.has((obj as any).id)) return

      if ((obj as any).id) {
        sendObjectRemoved((obj as any).id)
      }
    }

    canvas.on('mouse:move', handleMouseMove)
    canvas.on('object:added', handleObjectAdded)
    canvas.on('object:modified', handleObjectModified)
    canvas.on('object:removed', handleObjectRemoved)

    return () => {
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('object:added', handleObjectAdded)
      canvas.off('object:modified', handleObjectModified)
      canvas.off('object:removed', handleObjectRemoved)
    }
  }, [canvas, isConnected, sendCursorMove, sendObjectAdded, sendObjectModified, sendObjectRemoved])

  return (
    <div className="relative h-full">
      <Whiteboard boardId={boardId} />
      <RemoteCursors />
    </div>
  )
}
