import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Whiteboard } from '@/components/canvas/whiteboard'
import { CollaborativeWhiteboard } from '@/components/canvas/collaborative-whiteboard'
import { MainToolbar } from '@/components/toolbar/main-toolbar'
import { useCanvasStore } from '@/stores/canvas-store'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/board/$boardId')({
  component: BoardPage,
})

function BoardPage() {
  const { boardId } = Route.useParams()
  const token = useAuthStore((state) => state.token)
  const canvas = useCanvasStore((state) => state.canvas)
  const loadFromLocalStorage = useCanvasStore((state) => state.loadFromLocalStorage)
  const [loaded, setLoaded] = useState(false)

  // Load saved board from localStorage when canvas is ready (for non-authenticated users)
  useEffect(() => {
    if (canvas && !loaded && !token) {
      loadFromLocalStorage(boardId).then((success) => {
        if (success) {
          console.log(`Loaded board ${boardId} from local storage`)
        }
        setLoaded(true)
      })
    }
  }, [canvas, boardId, loadFromLocalStorage, loaded, token])

  return (
    <div className="h-screen w-screen overflow-hidden">
      <MainToolbar boardId={boardId} />
      <div className="pt-[60px] h-full">
        {token ? (
          <CollaborativeWhiteboard boardId={boardId} />
        ) : (
          <Whiteboard boardId={boardId} />
        )}
      </div>
    </div>
  )
}
