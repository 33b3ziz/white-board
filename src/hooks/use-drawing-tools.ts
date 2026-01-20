import { useEffect, useCallback, useRef } from 'react'
import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric'
import { useToolsStore } from '@/stores/tools-store'
import { useCanvasStore } from '@/stores/canvas-store'
import { setupPencilBrush, setupEraserBrush } from '@/lib/canvas/fabric-utils'
import {
  createRectangle,
  createCircle,
  createLine,
  createText,
  addShapeToCanvas,
} from '@/lib/canvas/object-factory'
import type { ToolType } from '@/types/tools'

export function useDrawingTools(canvas: Canvas | null) {
  const { activeTool, brushSettings, shapeSettings } = useToolsStore()
  const { saveToHistory } = useCanvasStore()
  const isDrawingShape = useRef(false)
  const startPoint = useRef<{ x: number; y: number } | null>(null)
  const currentShape = useRef<ReturnType<typeof createRectangle> | ReturnType<typeof createCircle> | ReturnType<typeof createLine> | null>(null)

  // Apply tool settings when tool changes
  useEffect(() => {
    if (!canvas) return

    // Reset canvas drawing mode
    canvas.isDrawingMode = false
    canvas.selection = true

    switch (activeTool) {
      case 'pen':
        canvas.isDrawingMode = true
        canvas.freeDrawingBrush = setupPencilBrush(canvas, {
          color: brushSettings.color,
          width: brushSettings.size,
          opacity: brushSettings.opacity,
        })
        break

      case 'eraser':
        canvas.isDrawingMode = true
        canvas.freeDrawingBrush = setupEraserBrush(canvas, {
          width: brushSettings.size,
        })
        break

      case 'select':
        canvas.selection = true
        break

      case 'rectangle':
      case 'circle':
      case 'line':
      case 'text':
        canvas.selection = false
        break
    }
  }, [canvas, activeTool, brushSettings])

  // Handle shape drawing
  useEffect(() => {
    if (!canvas) return
    if (!['rectangle', 'circle', 'line', 'text'].includes(activeTool)) return

    const handleMouseDown = (e: TPointerEventInfo<TPointerEvent>) => {
      if (activeTool === 'text') {
        const pointer = canvas.getScenePoint(e.e)
        const text = createText({
          left: pointer.x,
          top: pointer.y,
          ...shapeSettings,
        })
        addShapeToCanvas(canvas, text)
        text.enterEditing()
        return
      }

      isDrawingShape.current = true
      const pointer = canvas.getScenePoint(e.e)
      startPoint.current = { x: pointer.x, y: pointer.y }

      if (activeTool === 'rectangle') {
        currentShape.current = createRectangle({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          ...shapeSettings,
        })
      } else if (activeTool === 'circle') {
        currentShape.current = createCircle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          ...shapeSettings,
        })
      } else if (activeTool === 'line') {
        currentShape.current = createLine({
          left: pointer.x,
          top: pointer.y,
          x2: pointer.x,
          y2: pointer.y,
          ...shapeSettings,
        })
      }

      if (currentShape.current) {
        canvas.add(currentShape.current)
      }
    }

    const handleMouseMove = (e: TPointerEventInfo<TPointerEvent>) => {
      if (!isDrawingShape.current || !startPoint.current || !currentShape.current) return

      const pointer = canvas.getScenePoint(e.e)
      const width = pointer.x - startPoint.current.x
      const height = pointer.y - startPoint.current.y

      if (activeTool === 'rectangle') {
        currentShape.current.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : startPoint.current.x,
          top: height < 0 ? pointer.y : startPoint.current.y,
        })
      } else if (activeTool === 'circle') {
        const radius = Math.sqrt(width * width + height * height) / 2
        ;(currentShape.current as ReturnType<typeof createCircle>).set({
          radius,
        })
      } else if (activeTool === 'line') {
        ;(currentShape.current as ReturnType<typeof createLine>).set({
          x2: pointer.x,
          y2: pointer.y,
        })
      }

      canvas.requestRenderAll()
    }

    const handleMouseUp = () => {
      if (isDrawingShape.current && currentShape.current) {
        canvas.setActiveObject(currentShape.current)
        saveToHistory()
      }
      isDrawingShape.current = false
      startPoint.current = null
      currentShape.current = null
    }

    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)

    return () => {
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
    }
  }, [canvas, activeTool, shapeSettings, saveToHistory])

  return { activeTool }
}

export function useKeyboardShortcuts(canvas: Canvas | null) {
  const { setActiveTool } = useToolsStore()
  const { undo, redo, canUndo, canRedo } = useCanvasStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) undo()
        return
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault()
        if (canRedo()) redo()
        return
      }

      // Delete selected objects
      if ((e.key === 'Delete' || e.key === 'Backspace') && canvas) {
        const activeObject = canvas.getActiveObject()
        // Don't delete if we're editing text
        if (activeObject && activeObject.type !== 'i-text') {
          e.preventDefault()
          canvas.remove(activeObject)
          canvas.discardActiveObject()
          canvas.requestRenderAll()
        }
      }

      // Tool shortcuts
      const toolShortcuts: Record<string, ToolType> = {
        v: 'select',
        p: 'pen',
        e: 'eraser',
        r: 'rectangle',
        o: 'circle',
        l: 'line',
        t: 'text',
      }

      const tool = toolShortcuts[e.key.toLowerCase()]
      if (tool) {
        e.preventDefault()
        setActiveTool(tool)
      }
    },
    [canvas, setActiveTool, undo, redo, canUndo, canRedo]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
