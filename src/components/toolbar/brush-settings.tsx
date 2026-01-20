import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Settings2 } from 'lucide-react'
import { useToolsStore } from '@/stores/tools-store'

export function BrushSettings() {
  const { brushSettings, setBrushSize, setBrushOpacity } = useToolsStore()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" title="Brush Settings">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Size</label>
              <span className="text-xs text-muted-foreground">
                {brushSettings.size}px
              </span>
            </div>
            <Slider
              value={[brushSettings.size]}
              min={1}
              max={50}
              step={1}
              onValueChange={([value]) => setBrushSize(value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Opacity</label>
              <span className="text-xs text-muted-foreground">
                {Math.round(brushSettings.opacity * 100)}%
              </span>
            </div>
            <Slider
              value={[brushSettings.opacity]}
              min={0.1}
              max={1}
              step={0.1}
              onValueChange={([value]) => setBrushOpacity(value)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
