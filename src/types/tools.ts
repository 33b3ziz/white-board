export type ToolType =
  | 'select'
  | 'pen'
  | 'eraser'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'text'

export interface BrushSettings {
  color: string
  size: number
  opacity: number
}

export interface ShapeSettings {
  fillColor: string
  strokeColor: string
  strokeWidth: number
}

export interface ToolSettings {
  brush: BrushSettings
  shape: ShapeSettings
}

export const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
  color: '#000000',
  size: 5,
  opacity: 1,
}

export const DEFAULT_SHAPE_SETTINGS: ShapeSettings = {
  fillColor: 'transparent',
  strokeColor: '#000000',
  strokeWidth: 2,
}

export const PRESET_COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#6b7280', // Gray
]
