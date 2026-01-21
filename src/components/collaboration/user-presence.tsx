import { useCollaborationStore } from '@/stores/collaboration-store'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Users } from 'lucide-react'

export function UserPresence() {
  const isConnected = useCollaborationStore((state) => state.isConnected)
  const users = useCollaborationStore((state) => state.users)
  const myUserId = useCollaborationStore((state) => state.myUserId)

  // Get other users (not including self)
  const otherUsers = users.filter((u) => u.userId !== myUserId)

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-xs">Offline</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Connection indicator */}
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

      {/* User avatars */}
      <div className="flex -space-x-2">
        {otherUsers.slice(0, 5).map((user) => (
          <Tooltip key={user.odId}>
            <TooltipTrigger asChild>
              <div
                className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white cursor-default"
                style={{ backgroundColor: user.color }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.displayName.charAt(0).toUpperCase()
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.displayName}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Show overflow count */}
        {otherUsers.length > 5 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium cursor-default">
                +{otherUsers.length - 5}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{otherUsers.length - 5} more users</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* User count */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-default">
            <Users className="h-3.5 w-3.5" />
            <span>{users.length}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{users.length} user{users.length !== 1 ? 's' : ''} online</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
