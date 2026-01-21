import { useCollaborationStore } from '@/stores/collaboration-store'

export function RemoteCursors() {
  const users = useCollaborationStore((state) => state.users)
  const myUserId = useCollaborationStore((state) => state.myUserId)

  // Filter out current user and users without cursor positions
  const remoteCursors = users.filter(
    (user) => user.userId !== myUserId && user.cursor
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {remoteCursors.map((user) => (
        <div
          key={user.odId}
          className="absolute transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${user.cursor!.x}px, ${user.cursor!.y}px)`,
          }}
        >
          {/* Cursor pointer */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-md"
          >
            <path
              d="M5.65376 12.4563L5.96591 12.7845L5.65376 12.4563L5.35407 12.7476L5.65376 12.4563ZM5.65376 12.4563L12.1862 5.65631C12.5155 5.31563 13.0502 5.27477 13.4259 5.56006L13.6328 5.71667L13.4259 5.56006C13.8016 5.84536 13.9196 6.36713 13.7 6.78606L13.6006 6.97622L13.7 6.78606L10.3339 13.3838L10.1494 13.7507L10.5561 13.7507L18.1246 13.7507C18.6065 13.7507 19 14.1442 19 14.6261V14.8745C19 15.3564 18.6065 15.7499 18.1246 15.7499L10.5561 15.7499L10.1494 15.7499L10.3339 16.1168L13.7 22.7146L13.6006 22.9047L13.7 22.7146C13.9196 23.1336 13.8016 23.6553 13.4259 23.9406L13.2327 24.0879L13.4259 23.9406C13.0502 24.2259 12.5155 24.185 12.1862 23.8443L5.65376 17.0443L5.35407 17.3356L5.65376 17.0443L5.35407 16.7531L5.65376 17.0443L5.65376 12.4563Z"
              fill={user.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>

          {/* User name label */}
          <div
            className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap shadow-md"
            style={{ backgroundColor: user.color }}
          >
            {user.displayName}
          </div>
        </div>
      ))}
    </div>
  )
}
