import { create } from 'zustand'
import type { UserPresence, CursorPosition } from '@/server/websocket/types'

interface CollaborationState {
  isConnected: boolean
  users: UserPresence[]
  myUserId: string | null

  setConnected: (connected: boolean) => void
  setUsers: (users: UserPresence[]) => void
  setMyUserId: (userId: string | null) => void
  addUser: (user: UserPresence) => void
  removeUser: (odId: string) => void
  updateCursor: (odId: string, position: CursorPosition) => void
  reset: () => void
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  isConnected: false,
  users: [],
  myUserId: null,

  setConnected: (isConnected) => set({ isConnected }),
  setUsers: (users) => set({ users }),
  setMyUserId: (myUserId) => set({ myUserId }),

  addUser: (user) =>
    set((state) => ({
      users: [...state.users.filter((u) => u.odId !== user.odId), user],
    })),

  removeUser: (odId) =>
    set((state) => ({
      users: state.users.filter((u) => u.odId !== odId),
    })),

  updateCursor: (odId, position) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.odId === odId ? { ...u, cursor: position, lastSeen: Date.now() } : u
      ),
    })),

  reset: () => set({ isConnected: false, users: [], myUserId: null }),
}))
