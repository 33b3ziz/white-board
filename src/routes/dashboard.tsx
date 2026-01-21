import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { getMyBoards, createBoard, deleteBoard } from '@/server/functions/boards'
import {
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  LayoutDashboard,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

interface Board {
  id: string
  name: string
  shareLink: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  role: string
}

function DashboardPage() {
  const { user, token } = useAuthStore()
  const navigate = useNavigate()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [newBoardName, setNewBoardName] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate({ to: '/' })
    }
  }, [token, navigate])

  // Load boards
  useEffect(() => {
    if (token) {
      loadBoards()
    }
  }, [token])

  const loadBoards = async () => {
    if (!token) return

    setLoading(true)
    try {
      const result = await getMyBoards({ data: { token } })
      if (result.success) {
        setBoards(result.boards as Board[])
      }
    } catch (error) {
      console.error('Failed to load boards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBoard = async () => {
    if (!token) return

    setCreating(true)
    try {
      const result = await createBoard({
        data: { token, name: newBoardName || 'Untitled Board' },
      })
      if (result.success && result.board) {
        setCreateDialogOpen(false)
        setNewBoardName('')
        // Navigate to the new board
        navigate({ to: '/board/$boardId', params: { boardId: result.board.id } })
      }
    } catch (error) {
      console.error('Failed to create board:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteBoard = async () => {
    if (!token || !boardToDelete) return

    setDeleting(true)
    try {
      const result = await deleteBoard({
        data: { token, boardId: boardToDelete.id },
      })
      if (result.success) {
        setBoards((prev) => prev.filter((b) => b.id !== boardToDelete.id))
        setDeleteDialogOpen(false)
        setBoardToDelete(null)
      }
    } catch (error) {
      console.error('Failed to delete board:', error)
    } finally {
      setDeleting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Boards</h1>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
                <DialogDescription>
                  Give your board a name to get started.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="boardName">Board Name</Label>
                <Input
                  id="boardName"
                  placeholder="My Awesome Board"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateBoard} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Board
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Boards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium mb-2">No boards yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first board to get started.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Board
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="border rounded-lg p-4 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <Link
                    to="/board/$boardId"
                    params={{ boardId: board.id }}
                    className="font-medium text-lg hover:text-primary transition-colors flex-1"
                  >
                    {board.name}
                  </Link>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setBoardToDelete(board)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      board.role === 'owner'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted'
                    }`}
                  >
                    {board.role}
                  </span>
                  <span>
                    Updated{' '}
                    {new Date(board.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {board.shareLink && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      /share/{board.shareLink}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Board</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{boardToDelete?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBoard}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
