import type { Canvas as FabricCanvas, FabricObject } from 'fabric'

export interface CanvasState {
  canvas: FabricCanvas | null
  isReady: boolean
}

export interface HistoryState {
  past: string[]
  future: string[]
}

export interface CanvasSnapshot {
  objects: FabricObject[]
  background?: string
}

export const MAX_HISTORY_SIZE = 50
