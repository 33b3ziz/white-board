import { create } from 'zustand'
import type { ToolType, BrushSettings, ShapeSettings } from '@/types/tools'
import { DEFAULT_BRUSH_SETTINGS, DEFAULT_SHAPE_SETTINGS } from '@/types/tools'

interface ToolsState {
  activeTool: ToolType
  brushSettings: BrushSettings
  shapeSettings: ShapeSettings

  setActiveTool: (tool: ToolType) => void
  setBrushColor: (color: string) => void
  setBrushSize: (size: number) => void
  setBrushOpacity: (opacity: number) => void
  setShapeFillColor: (color: string) => void
  setShapeStrokeColor: (color: string) => void
  setShapeStrokeWidth: (width: number) => void
}

export const useToolsStore = create<ToolsState>((set) => ({
  activeTool: 'select',
  brushSettings: DEFAULT_BRUSH_SETTINGS,
  shapeSettings: DEFAULT_SHAPE_SETTINGS,

  setActiveTool: (tool) => set({ activeTool: tool }),

  setBrushColor: (color) =>
    set((state) => ({
      brushSettings: { ...state.brushSettings, color },
    })),

  setBrushSize: (size) =>
    set((state) => ({
      brushSettings: { ...state.brushSettings, size },
    })),

  setBrushOpacity: (opacity) =>
    set((state) => ({
      brushSettings: { ...state.brushSettings, opacity },
    })),

  setShapeFillColor: (fillColor) =>
    set((state) => ({
      shapeSettings: { ...state.shapeSettings, fillColor },
    })),

  setShapeStrokeColor: (strokeColor) =>
    set((state) => ({
      shapeSettings: { ...state.shapeSettings, strokeColor },
    })),

  setShapeStrokeWidth: (strokeWidth) =>
    set((state) => ({
      shapeSettings: { ...state.shapeSettings, strokeWidth },
    })),
}))
