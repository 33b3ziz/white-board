import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas-store'

export function ZoomControls() {
  const zoom = useCanvasStore((state) => state.zoom)
  const zoomIn = useCanvasStore((state) => state.zoomIn)
  const zoomOut = useCanvasStore((state) => state.zoomOut)
  const resetZoom = useCanvasStore((state) => state.resetZoom)

  const zoomPercentage = Math.round(zoom * 100)

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            disabled={zoom <= 0.1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom Out <kbd className="ml-1 text-xs opacity-60">(Ctrl+-)</kbd></p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={resetZoom}
            className="min-w-[60px] text-xs"
          >
            {zoomPercentage}%
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reset Zoom <kbd className="ml-1 text-xs opacity-60">(Ctrl+0)</kbd></p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={zoomIn}
            disabled={zoom >= 5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom In <kbd className="ml-1 text-xs opacity-60">(Ctrl++)</kbd></p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
