import { Canvas, PencilBrush, type FabricObject } from 'fabric'

export function createCanvas(
  canvasElement: HTMLCanvasElement,
  options?: Partial<{ width: number; height: number }>
): Canvas {
  const canvas = new Canvas(canvasElement, {
    width: options?.width ?? window.innerWidth,
    height: options?.height ?? window.innerHeight - 60, // Account for toolbar
    backgroundColor: '#ffffff',
    selection: true,
    preserveObjectStacking: true,
  })

  return canvas
}

export function setupPencilBrush(
  canvas: Canvas,
  options: { color: string; width: number; opacity?: number }
): PencilBrush {
  const brush = new PencilBrush(canvas)
  brush.color = options.color
  brush.width = options.width
  if (options.opacity !== undefined) {
    // For opacity, we modify the color to include alpha
    brush.color = hexToRgba(options.color, options.opacity)
  }
  return brush
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function setupEraserBrush(
  canvas: Canvas,
  options: { width: number }
): PencilBrush {
  const brush = new PencilBrush(canvas)
  brush.color = '#ffffff'
  brush.width = options.width
  return brush
}

export function getSelectedObjects(canvas: Canvas): FabricObject[] {
  return canvas.getActiveObjects()
}

export function deleteSelectedObjects(canvas: Canvas): void {
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length === 0) return

  canvas.discardActiveObject()
  activeObjects.forEach((obj) => {
    canvas.remove(obj)
  })
  canvas.requestRenderAll()
}

export function clearCanvas(canvas: Canvas): void {
  canvas.clear()
  canvas.backgroundColor = '#ffffff'
  canvas.requestRenderAll()
}

export function resizeCanvas(
  canvas: Canvas,
  width: number,
  height: number
): void {
  canvas.setDimensions({ width, height })
  canvas.requestRenderAll()
}
