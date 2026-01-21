import { useEffect } from 'react'
import { useCanvas, useCanvasEvents } from '@/hooks/use-canvas'
import { useDrawingTools, useKeyboardShortcuts, useZoomPan } from '@/hooks/use-drawing-tools'

interface WhiteboardProps {
  boardId?: string
}

export function Whiteboard({ boardId }: WhiteboardProps) {
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

  // Set up zoom and pan
  useZoomPan(canvas)

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      <canvas ref={canvasRef} id="whiteboard-canvas" />
    </div>
  )
}
