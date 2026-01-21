import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Whiteboard } from '@/components/canvas/whiteboard'
import { MainToolbar } from '@/components/toolbar/main-toolbar'
import { useCanvasStore } from '@/stores/canvas-store'

export const Route = createFileRoute('/board/$boardId')({
  component: BoardPage,
})

function BoardPage() {
  const { boardId } = Route.useParams()
  const canvas = useCanvasStore((state) => state.canvas)
  const loadFromLocalStorage = useCanvasStore((state) => state.loadFromLocalStorage)
  const [loaded, setLoaded] = useState(false)

  // Load saved board from localStorage when canvas is ready
  useEffect(() => {
    if (canvas && !loaded) {
      loadFromLocalStorage(boardId).then((success) => {
        if (success) {
          console.log(`Loaded board ${boardId} from local storage`)
        }
        setLoaded(true)
      })
    }
  }, [canvas, boardId, loadFromLocalStorage, loaded])

  return (
    <div className="h-screen w-screen overflow-hidden">
      <MainToolbar boardId={boardId} />
      <div className="pt-[60px] h-full">
        <Whiteboard boardId={boardId} />
      </div>
    </div>
  )
}
