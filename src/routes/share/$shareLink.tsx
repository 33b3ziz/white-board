import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CollaborativeWhiteboard } from '@/components/canvas/collaborative-whiteboard'
import { MainToolbar } from '@/components/toolbar/main-toolbar'
import { getBoard } from '@/server/functions/boards'
import { useAuthStore } from '@/stores/auth-store'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/share/$shareLink')({
  component: SharePage,
})

function SharePage() {
  const { shareLink } = Route.useParams()
  const token = useAuthStore((state) => state.token)
  const [boardId, setBoardId] = useState<string | null>(null)
  const [boardName, setBoardName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBoard()
  }, [shareLink, token])

  const loadBoard = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getBoard({
        data: { shareLink, token: token || undefined },
      })

      if (result.success && result.board) {
        setBoardId(result.board.id)
        setBoardName(result.board.name)
      } else {
        setError(result.error || 'Board not found')
      }
    } catch (err) {
      setError('Failed to load board')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !boardId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Board Not Found</h2>
          <p className="text-muted-foreground">{error || 'This board does not exist or you do not have access.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <MainToolbar boardId={boardId} />
      <div className="pt-[60px] h-full">
        <CollaborativeWhiteboard boardId={boardId} />
      </div>
    </div>
  )
}
