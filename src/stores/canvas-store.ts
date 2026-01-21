import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Canvas as FabricCanvas, FabricObject } from 'fabric'
import { MAX_HISTORY_SIZE } from '@/types/canvas'

interface CanvasStore {
  canvas: FabricCanvas | null
  isReady: boolean
  history: string[]
  historyIndex: number

  // Clipboard
  clipboard: string | null

  // Zoom & Pan
  zoom: number
  isPanning: boolean

  setCanvas: (canvas: FabricCanvas | null) => void
  setReady: (isReady: boolean) => void

  // History management
  saveToHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void

  // Clipboard operations
  copy: () => void
  paste: () => void
  duplicate: () => void

  // Zoom operations
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setIsPanning: (isPanning: boolean) => void

  // Layer operations
  bringToFront: () => void
  sendToBack: () => void
  bringForward: () => void
  sendBackward: () => void

  // Local storage
  saveToLocalStorage: (boardId: string) => void
  loadFromLocalStorage: (boardId: string) => Promise<boolean>
}

const ZOOM_STEP = 0.1
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  canvas: null,
  isReady: false,
  history: [],
  historyIndex: -1,
  clipboard: null,
  zoom: 1,
  isPanning: false,

  setCanvas: (canvas) => set({ canvas }),
  setReady: (isReady) => set({ isReady }),

  saveToHistory: () => {
    const { canvas, history, historyIndex } = get()
    if (!canvas) return

    const json = JSON.stringify(canvas.toJSON())

    // Remove any future states if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1)

    // Add new state
    newHistory.push(json)

    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift()
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  undo: () => {
    const { canvas, history, historyIndex } = get()
    if (!canvas || historyIndex <= 0) return

    const newIndex = historyIndex - 1
    const previousState = history[newIndex]

    canvas.loadFromJSON(previousState).then(() => {
      canvas.renderAll()
      set({ historyIndex: newIndex })
    })
  },

  redo: () => {
    const { canvas, history, historyIndex } = get()
    if (!canvas || historyIndex >= history.length - 1) return

    const newIndex = historyIndex + 1
    const nextState = history[newIndex]

    canvas.loadFromJSON(nextState).then(() => {
      canvas.renderAll()
      set({ historyIndex: newIndex })
    })
  },

  canUndo: () => {
    const { historyIndex } = get()
    return historyIndex > 0
  },

  canRedo: () => {
    const { history, historyIndex } = get()
    return historyIndex < history.length - 1
  },

  clearHistory: () => {
    set({ history: [], historyIndex: -1 })
  },

  // Clipboard operations
  copy: () => {
    const { canvas } = get()
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    activeObject.clone().then((cloned: FabricObject) => {
      set({ clipboard: JSON.stringify(cloned.toJSON()) })
    })
  },

  paste: () => {
    const { canvas, clipboard, saveToHistory } = get()
    if (!canvas || !clipboard) return

    const parsed = JSON.parse(clipboard)

    import('fabric').then(({ util }) => {
      util.enlivenObjects([parsed]).then((objects: FabricObject[]) => {
        objects.forEach((obj) => {
          // Offset pasted object slightly
          obj.set({
            left: (obj.left || 0) + 20,
            top: (obj.top || 0) + 20,
          })
          canvas.add(obj)
          canvas.setActiveObject(obj)
        })
        canvas.requestRenderAll()
        saveToHistory()
      })
    })
  },

  duplicate: () => {
    const { canvas, saveToHistory } = get()
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    activeObject.clone().then((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      })
      canvas.add(cloned)
      canvas.setActiveObject(cloned)
      canvas.requestRenderAll()
      saveToHistory()
    })
  },

  // Zoom operations
  setZoom: (zoom) => {
    const { canvas } = get()
    if (!canvas) return

    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
    const center = canvas.getCenterPoint()
    canvas.zoomToPoint(center, clampedZoom)
    set({ zoom: clampedZoom })
  },

  zoomIn: () => {
    const { zoom, setZoom } = get()
    setZoom(zoom + ZOOM_STEP)
  },

  zoomOut: () => {
    const { zoom, setZoom } = get()
    setZoom(zoom - ZOOM_STEP)
  },

  resetZoom: () => {
    const { canvas } = get()
    if (!canvas) return

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    set({ zoom: 1 })
  },

  setIsPanning: (isPanning) => set({ isPanning }),

  // Layer operations
  bringToFront: () => {
    const { canvas, saveToHistory } = get()
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    canvas.bringObjectToFront(activeObject)
    canvas.requestRenderAll()
    saveToHistory()
  },

  sendToBack: () => {
    const { canvas, saveToHistory } = get()
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    canvas.sendObjectToBack(activeObject)
    canvas.requestRenderAll()
    saveToHistory()
  },

  bringForward: () => {
    const { canvas, saveToHistory } = get()
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    canvas.bringObjectForward(activeObject)
    canvas.requestRenderAll()
    saveToHistory()
  },

  sendBackward: () => {
    const { canvas, saveToHistory } = get()
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    canvas.sendObjectBackwards(activeObject)
    canvas.requestRenderAll()
    saveToHistory()
  },

  // Local storage operations
  saveToLocalStorage: (boardId: string) => {
    const { canvas } = get()
    if (!canvas) return

    const json = JSON.stringify(canvas.toJSON())
    localStorage.setItem(`whiteboard-${boardId}`, json)
  },

  loadFromLocalStorage: async (boardId: string) => {
    const { canvas, saveToHistory } = get()
    if (!canvas) return false

    const saved = localStorage.getItem(`whiteboard-${boardId}`)
    if (!saved) return false

    await canvas.loadFromJSON(saved)
    canvas.renderAll()
    saveToHistory()
    return true
  },
}))
