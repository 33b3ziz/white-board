import { useCanvasStore } from '@/stores/canvas-store'

export function useHistory() {
  // Subscribe to specific state values to trigger re-renders
  const history = useCanvasStore((state) => state.history)
  const historyIndex = useCanvasStore((state) => state.historyIndex)
  const undo = useCanvasStore((state) => state.undo)
  const redo = useCanvasStore((state) => state.redo)
  const clearHistory = useCanvasStore((state) => state.clearHistory)

  return {
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    clearHistory,
    historyLength: history.length,
    historyIndex,
  }
}
