import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  MousePointer2,
  Pencil,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Save,
} from 'lucide-react'
import { useState } from 'react'
import { useToolsStore } from '@/stores/tools-store'
import { useCanvasStore } from '@/stores/canvas-store'
import { useHistory } from '@/hooks/use-history'
import { clearCanvas } from '@/lib/canvas/fabric-utils'
import { ColorPicker } from './color-picker'
import { BrushSettings } from './brush-settings'
import { ZoomControls } from './zoom-controls'
import { LayersPanel } from './layers-panel'
import { ExportDialog } from './export-dialog'
import type { ToolType } from '@/types/tools'

const tools: { id: ToolType; icon: typeof MousePointer2; label: string; shortcut: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'pen', icon: Pencil, label: 'Pen', shortcut: 'P' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'O' },
  { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
]

interface MainToolbarProps {
  boardId?: string
}

export function MainToolbar({ boardId = 'default' }: MainToolbarProps) {
  const { activeTool, setActiveTool, brushSettings, setBrushColor } = useToolsStore()
  const canvas = useCanvasStore((state) => state.canvas)
  const saveToLocalStorage = useCanvasStore((state) => state.saveToLocalStorage)
  const { undo, redo, canUndo, canRedo, clearHistory } = useHistory()
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const handleClear = () => {
    if (canvas) {
      clearCanvas(canvas)
      clearHistory()
    }
    setClearDialogOpen(false)
  }

  const handleSave = () => {
    saveToLocalStorage(boardId)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-2 flex items-center gap-2 h-[60px]">
        {/* Tool Selection */}
        <ToggleGroup
          type="single"
          value={activeTool}
          onValueChange={(value) => value && setActiveTool(value as ToolType)}
        >
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={tool.id}
                  aria-label={tool.label}
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <tool.icon className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {tool.label} <kbd className="ml-1 text-xs opacity-60">({tool.shortcut})</kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>

        <Separator orientation="vertical" className="h-8" />

        {/* Color Picker */}
        <ColorPicker
          color={brushSettings.color}
          onChange={setBrushColor}
          label="Color"
        />

        {/* Brush Settings */}
        <BrushSettings />

        <Separator orientation="vertical" className="h-8" />

        {/* History Controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Undo <kbd className="ml-1 text-xs opacity-60">(Ctrl+Z)</kbd>
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Redo <kbd className="ml-1 text-xs opacity-60">(Ctrl+Y)</kbd>
            </p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-8" />

        {/* Zoom Controls */}
        <ZoomControls />

        <Separator orientation="vertical" className="h-8" />

        {/* Layers Panel */}
        <LayersPanel />

        {/* Export Dialog */}
        <ExportDialog />

        {/* Save to Local Storage */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={handleSave}>
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save to Browser</p>
          </TooltipContent>
        </Tooltip>

        {/* Clear Canvas */}
        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear Canvas</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear Canvas</DialogTitle>
              <DialogDescription>
                Are you sure you want to clear the entire canvas? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClear}>
                Clear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
