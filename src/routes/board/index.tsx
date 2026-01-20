import { createFileRoute } from '@tanstack/react-router'
import { Whiteboard } from '@/components/canvas/whiteboard'
import { MainToolbar } from '@/components/toolbar/main-toolbar'

export const Route = createFileRoute('/board/')({
  component: BoardPage,
})

function BoardPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <MainToolbar />
      <div className="pt-[60px] h-full">
        <Whiteboard />
      </div>
    </div>
  )
}
