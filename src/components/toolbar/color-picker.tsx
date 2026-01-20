import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { PRESET_COLORS } from '@/types/tools'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-auto gap-2 px-2">
          <div
            className="w-5 h-5 rounded border border-gray-300"
            style={{ backgroundColor: color }}
          />
          {label && <span className="text-xs">{label}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-5 gap-1">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              className={cn(
                'w-7 h-7 rounded border-2 transition-all hover:scale-110',
                color === presetColor
                  ? 'border-primary ring-2 ring-primary ring-offset-1'
                  : 'border-gray-200'
              )}
              style={{ backgroundColor: presetColor }}
              onClick={() => onChange(presetColor)}
            />
          ))}
        </div>
        <div className="mt-2 pt-2 border-t">
          <label className="flex items-center gap-2 text-xs">
            <span>Custom:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  )
}
