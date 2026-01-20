import { useEffect } from 'react'
import { useCanvas, useCanvasEvents } from '@/hooks/use-canvas'
import { useDrawingTools, useKeyboardShortcuts } from '@/hooks/use-drawing-tools'

export function Whiteboard() {
  const { canvasRef, canvas, initCanvas } = useCanvas()

  // Initialize canvas on mount
  useEffect(() => {
    initCanvas()
  }, [initCanvas])

  // Set up canvas events for history tracking
  useCanvasEvents(canvas)

  // Set up drawing tools
  useDrawingTools(canvas)

  // Set up keyboard shortcuts
  useKeyboardShortcuts(canvas)

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      <canvas ref={canvasRef} id="whiteboard-canvas" />
    </div>
  )
}
