import { create } from 'zustand'
import type { Canvas as FabricCanvas } from 'fabric'
import { MAX_HISTORY_SIZE } from '@/types/canvas'

interface CanvasStore {
  canvas: FabricCanvas | null
  isReady: boolean
  history: string[]
  historyIndex: number

  setCanvas: (canvas: FabricCanvas | null) => void
  setReady: (isReady: boolean) => void

  // History management
  saveToHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  canvas: null,
  isReady: false,
  history: [],
  historyIndex: -1,

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
}))
