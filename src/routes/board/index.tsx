import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Whiteboard } from '@/components/canvas/whiteboard'
import { MainToolbar } from '@/components/toolbar/main-toolbar'
import { useCanvasStore } from '@/stores/canvas-store'

export const Route = createFileRoute('/board/')({
  component: BoardPage,
})

const DEFAULT_BOARD_ID = 'default'

function BoardPage() {
  const canvas = useCanvasStore((state) => state.canvas)
  const loadFromLocalStorage = useCanvasStore((state) => state.loadFromLocalStorage)
  const [loaded, setLoaded] = useState(false)

  // Load saved board from localStorage when canvas is ready
  useEffect(() => {
    if (canvas && !loaded) {
      loadFromLocalStorage(DEFAULT_BOARD_ID).then((success) => {
        if (success) {
          console.log(`Loaded board ${DEFAULT_BOARD_ID} from local storage`)
        }
        setLoaded(true)
      })
    }
  }, [canvas, loadFromLocalStorage, loaded])

  return (
    <div className="h-screen w-screen overflow-hidden">
      <MainToolbar boardId={DEFAULT_BOARD_ID} />
      <div className="pt-[60px] h-full">
        <Whiteboard boardId={DEFAULT_BOARD_ID} />
      </div>
    </div>
  )
}
