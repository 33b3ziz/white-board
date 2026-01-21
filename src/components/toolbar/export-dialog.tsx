import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Download, Image, FileCode } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas-store'

type ExportFormat = 'png' | 'svg' | 'json'

export function ExportDialog() {
  const canvas = useCanvasStore((state) => state.canvas)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [open, setOpen] = useState(false)

  const handleExport = () => {
    if (!canvas) return

    switch (format) {
      case 'png':
        exportAsPNG()
        break
      case 'svg':
        exportAsSVG()
        break
      case 'json':
        exportAsJSON()
        break
    }

    setOpen(false)
  }

  const exportAsPNG = () => {
    if (!canvas) return

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    })

    downloadFile(dataURL, 'whiteboard.png')
  }

  const exportAsSVG = () => {
    if (!canvas) return

    const svg = canvas.toSVG()
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    downloadFile(url, 'whiteboard.svg')
    URL.revokeObjectURL(url)
  }

  const exportAsJSON = () => {
    if (!canvas) return

    const json = JSON.stringify(canvas.toJSON(), null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    downloadFile(url, 'whiteboard.json')
    URL.revokeObjectURL(url)
  }

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Canvas</DialogTitle>
          <DialogDescription>
            Choose a format to export your whiteboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={(value) => value && setFormat(value as ExportFormat)}
              className="justify-start"
            >
              <ToggleGroupItem value="png" className="flex gap-2">
                <Image className="h-4 w-4" />
                PNG
              </ToggleGroupItem>
              <ToggleGroupItem value="svg" className="flex gap-2">
                <FileCode className="h-4 w-4" />
                SVG
              </ToggleGroupItem>
              <ToggleGroupItem value="json" className="flex gap-2">
                <FileCode className="h-4 w-4" />
                JSON
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="text-sm text-muted-foreground">
            {format === 'png' && (
              <p>Export as a high-resolution PNG image (2x scale).</p>
            )}
            {format === 'svg' && (
              <p>Export as a scalable SVG vector file.</p>
            )}
            {format === 'json' && (
              <p>Export the canvas data as JSON for later import.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
