// WebSocket message types for real-time collaboration

export interface CursorPosition {
  x: number
  y: number
}

export interface UserPresence {
  odId: string
  userId: string
  displayName: string
  avatarUrl?: string
  color: string
  cursor?: CursorPosition
  lastSeen: number
}

// Client -> Server messages
export type ClientMessage =
  | { type: 'join'; boardId: string; token: string }
  | { type: 'leave' }
  | { type: 'cursor_move'; position: CursorPosition }
  | { type: 'object_added'; objectId: string; objectData: object }
  | { type: 'object_modified'; objectId: string; objectData: object }
  | { type: 'object_removed'; objectId: string }
  | { type: 'canvas_clear' }
  | { type: 'sync_request' }

// Server -> Client messages
export type ServerMessage =
  | { type: 'joined'; boardId: string; userId: string; users: UserPresence[] }
  | { type: 'error'; message: string }
  | { type: 'user_joined'; user: UserPresence }
  | { type: 'user_left'; odId: string }
  | { type: 'cursor_update'; odId: string; position: CursorPosition }
  | { type: 'object_added'; odId: string; userId: string; objectId: string; objectData: object }
  | { type: 'object_modified'; odId: string; userId: string; objectId: string; objectData: object }
  | { type: 'object_removed'; odId: string; userId: string; objectId: string }
  | { type: 'canvas_cleared'; odId: string; userId: string }
  | { type: 'sync_response'; canvasData: object }

// Color palette for user cursors
export const USER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
]

export function getRandomUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}
