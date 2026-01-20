import { useEffect, useRef, useCallback } from 'react'
import type { Canvas } from 'fabric'
import { useCanvasStore } from '@/stores/canvas-store'
import { createCanvas, resizeCanvas } from '@/lib/canvas/fabric-utils'

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { canvas, setCanvas, setReady, saveToHistory } = useCanvasStore()

  const initCanvas = useCallback(() => {
    if (!canvasRef.current || canvas) return

    const fabricCanvas = createCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight - 60,
    })

    // Save initial state to history
    setCanvas(fabricCanvas)
    setReady(true)

    // Save initial empty state
    setTimeout(() => {
      saveToHistory()
    }, 100)

    return fabricCanvas
  }, [canvas, setCanvas, setReady, saveToHistory])

  // Handle window resize
  useEffect(() => {
    if (!canvas) return

    const handleResize = () => {
      resizeCanvas(canvas, window.innerWidth, window.innerHeight - 60)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [canvas])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (canvas) {
        canvas.dispose()
        setCanvas(null)
        setReady(false)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    canvasRef,
    canvas,
    initCanvas,
  }
}

export function useCanvasEvents(canvas: Canvas | null) {
  const { saveToHistory } = useCanvasStore()

  useEffect(() => {
    if (!canvas) return

    const handleObjectModified = () => {
      saveToHistory()
    }

    const handleObjectAdded = () => {
      saveToHistory()
    }

    const handlePathCreated = () => {
      saveToHistory()
    }

    canvas.on('object:modified', handleObjectModified)
    canvas.on('object:added', handleObjectAdded)
    canvas.on('path:created', handlePathCreated)

    return () => {
      canvas.off('object:modified', handleObjectModified)
      canvas.off('object:added', handleObjectAdded)
      canvas.off('path:created', handlePathCreated)
    }
  }, [canvas, saveToHistory])
}
