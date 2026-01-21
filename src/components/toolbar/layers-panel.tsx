import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Layers,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas-store'
import type { FabricObject } from 'fabric'
import { cn } from '@/lib/utils'

interface LayerItem {
  id: string
  name: string
  type: string
  visible: boolean
  locked: boolean
  object: FabricObject
}

export function LayersPanel() {
  const canvas = useCanvasStore((state) => state.canvas)
  const bringToFront = useCanvasStore((state) => state.bringToFront)
  const sendToBack = useCanvasStore((state) => state.sendToBack)
  const bringForward = useCanvasStore((state) => state.bringForward)
  const sendBackward = useCanvasStore((state) => state.sendBackward)
  const saveToHistory = useCanvasStore((state) => state.saveToHistory)

  const [layers, setLayers] = useState<LayerItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Update layers when canvas objects change
  useEffect(() => {
    if (!canvas) return

    const updateLayers = () => {
      const objects = canvas.getObjects()
      const newLayers: LayerItem[] = objects.map((obj, index) => ({
        id: `layer-${index}`,
        name: getObjectName(obj, index),
        type: obj.type || 'unknown',
        visible: obj.visible !== false,
        locked: obj.selectable === false,
        object: obj,
      })).reverse() // Reverse so top layers appear first

      setLayers(newLayers)

      // Update selected layer
      const activeObject = canvas.getActiveObject()
      if (activeObject) {
        const activeIndex = objects.indexOf(activeObject)
        setSelectedId(`layer-${activeIndex}`)
      } else {
        setSelectedId(null)
      }
    }

    updateLayers()

    canvas.on('object:added', updateLayers)
    canvas.on('object:removed', updateLayers)
    canvas.on('object:modified', updateLayers)
    canvas.on('selection:created', updateLayers)
    canvas.on('selection:updated', updateLayers)
    canvas.on('selection:cleared', updateLayers)

    return () => {
      canvas.off('object:added', updateLayers)
      canvas.off('object:removed', updateLayers)
      canvas.off('object:modified', updateLayers)
      canvas.off('selection:created', updateLayers)
      canvas.off('selection:updated', updateLayers)
      canvas.off('selection:cleared', updateLayers)
    }
  }, [canvas])

  const getObjectName = (obj: FabricObject, index: number): string => {
    const typeNames: Record<string, string> = {
      rect: 'Rectangle',
      circle: 'Circle',
      line: 'Line',
      path: 'Path',
      'i-text': 'Text',
      group: 'Group',
    }
    return typeNames[obj.type || ''] || `Object ${index + 1}`
  }

  const handleSelectLayer = (layer: LayerItem) => {
    if (!canvas) return
    canvas.setActiveObject(layer.object)
    canvas.requestRenderAll()
    setSelectedId(layer.id)
  }

  const toggleVisibility = (layer: LayerItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canvas) return

    layer.object.set('visible', !layer.visible)
    canvas.requestRenderAll()
    saveToHistory()

    // Trigger re-render
    setLayers((prev) =>
      prev.map((l) =>
        l.id === layer.id ? { ...l, visible: !l.visible } : l
      )
    )
  }

  const toggleLock = (layer: LayerItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canvas) return

    const newLocked = !layer.locked
    layer.object.set({
      selectable: !newLocked,
      evented: !newLocked,
    })
    canvas.requestRenderAll()

    // Trigger re-render
    setLayers((prev) =>
      prev.map((l) =>
        l.id === layer.id ? { ...l, locked: newLocked } : l
      )
    )
  }

  const hasSelection = selectedId !== null

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Layers className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Layers</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Layers</h4>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={bringToFront}
                    disabled={!hasSelection}
                  >
                    <ArrowUpToLine className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bring to Front</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={bringForward}
                    disabled={!hasSelection}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bring Forward</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={sendBackward}
                    disabled={!hasSelection}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send Backward</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={sendToBack}
                    disabled={!hasSelection}
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send to Back</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="border rounded-md max-h-64 overflow-y-auto">
            {layers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No objects on canvas
              </div>
            ) : (
              <div className="divide-y">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors',
                      selectedId === layer.id && 'bg-muted'
                    )}
                    onClick={() => handleSelectLayer(layer)}
                  >
                    <button
                      className="p-0.5 hover:bg-muted rounded"
                      onClick={(e) => toggleVisibility(layer, e)}
                    >
                      {layer.visible ? (
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
                      )}
                    </button>
                    <button
                      className="p-0.5 hover:bg-muted rounded"
                      onClick={(e) => toggleLock(layer, e)}
                    >
                      {layer.locked ? (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5 text-muted-foreground/50" />
                      )}
                    </button>
                    <span
                      className={cn(
                        'text-sm flex-1 truncate',
                        !layer.visible && 'text-muted-foreground/50'
                      )}
                    >
                      {layer.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
