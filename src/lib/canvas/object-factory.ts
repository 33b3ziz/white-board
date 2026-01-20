import { Rect, Circle, Line, IText, type Canvas } from 'fabric'
import type { ShapeSettings } from '@/types/tools'

interface ShapeOptions extends ShapeSettings {
  left: number
  top: number
  width?: number
  height?: number
}

export function createRectangle(options: ShapeOptions): Rect {
  return new Rect({
    left: options.left,
    top: options.top,
    width: options.width ?? 100,
    height: options.height ?? 100,
    fill: options.fillColor === 'transparent' ? '' : options.fillColor,
    stroke: options.strokeColor,
    strokeWidth: options.strokeWidth,
    strokeUniform: true,
  })
}

export function createCircle(
  options: ShapeOptions & { radius?: number }
): Circle {
  return new Circle({
    left: options.left,
    top: options.top,
    radius: options.radius ?? 50,
    fill: options.fillColor === 'transparent' ? '' : options.fillColor,
    stroke: options.strokeColor,
    strokeWidth: options.strokeWidth,
    strokeUniform: true,
  })
}

export function createLine(
  options: ShapeOptions & { x2?: number; y2?: number }
): Line {
  const x2 = options.x2 ?? options.left + 100
  const y2 = options.y2 ?? options.top
  return new Line([options.left, options.top, x2, y2], {
    stroke: options.strokeColor,
    strokeWidth: options.strokeWidth,
    strokeUniform: true,
  })
}

export function createText(
  options: ShapeOptions & { text?: string; fontSize?: number }
): IText {
  return new IText(options.text ?? 'Text', {
    left: options.left,
    top: options.top,
    fontSize: options.fontSize ?? 20,
    fill: options.strokeColor,
    fontFamily: 'Arial',
  })
}

export function addShapeToCanvas(
  canvas: Canvas,
  shape: Rect | Circle | Line | IText
): void {
  canvas.add(shape)
  canvas.setActiveObject(shape)
  canvas.requestRenderAll()
}
