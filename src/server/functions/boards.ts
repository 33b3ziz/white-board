import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db/index'
import { boards, boardCollaborators, sessions, users } from '@/db/schema'
import { eq, and, gt, or, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// Helper to verify session and get user ID
async function getUserIdFromToken(token: string): Promise<string | null> {
  if (!token) return null

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1)

  return session?.userId ?? null
}

// Create a new board
export const createBoard = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string; name?: string }) => data)
  .handler(async ({ data }) => {
    const { token, name } = data

    const userId = await getUserIdFromToken(token)
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const shareLink = nanoid(16)

    const [newBoard] = await db
      .insert(boards)
      .values({
        ownerId: userId,
        name: name || 'Untitled Board',
        shareLink,
        canvasData: { objects: [], version: '6.0.0' },
      })
      .returning()

    return {
      success: true,
      board: {
        id: newBoard.id,
        name: newBoard.name,
        shareLink: newBoard.shareLink,
        isPublic: newBoard.isPublic,
        createdAt: newBoard.createdAt,
      },
    }
  })

// Get user's boards (owned + collaborated)
export const getMyBoards = createServerFn({ method: 'GET' })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const { token } = data

    const userId = await getUserIdFromToken(token)
    if (!userId) {
      return { success: false, error: 'Not authenticated', boards: [] }
    }

    // Get owned boards
    const ownedBoards = await db
      .select({
        id: boards.id,
        name: boards.name,
        shareLink: boards.shareLink,
        isPublic: boards.isPublic,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt,
        role: () => 'owner' as const,
      })
      .from(boards)
      .where(eq(boards.ownerId, userId))
      .orderBy(desc(boards.updatedAt))

    // Get collaborated boards
    const collabBoards = await db
      .select({
        id: boards.id,
        name: boards.name,
        shareLink: boards.shareLink,
        isPublic: boards.isPublic,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt,
        role: boardCollaborators.accessLevel,
      })
      .from(boardCollaborators)
      .innerJoin(boards, eq(boardCollaborators.boardId, boards.id))
      .where(eq(boardCollaborators.userId, userId))
      .orderBy(desc(boards.updatedAt))

    return {
      success: true,
      boards: [...ownedBoards, ...collabBoards],
    }
  })

// Get a single board by ID or share link
export const getBoard = createServerFn({ method: 'GET' })
  .inputValidator((data: { token?: string; boardId?: string; shareLink?: string }) => data)
  .handler(async ({ data }) => {
    const { token, boardId, shareLink } = data

    const userId = token ? await getUserIdFromToken(token) : null

    // Find board
    let board
    if (boardId) {
      ;[board] = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1)
    } else if (shareLink) {
      ;[board] = await db.select().from(boards).where(eq(boards.shareLink, shareLink)).limit(1)
    }

    if (!board) {
      return { success: false, error: 'Board not found' }
    }

    // Check access
    const isOwner = userId === board.ownerId
    let accessLevel: string | null = isOwner ? 'owner' : null

    if (!isOwner && userId) {
      // Check if user is a collaborator
      const [collab] = await db
        .select()
        .from(boardCollaborators)
        .where(and(eq(boardCollaborators.boardId, board.id), eq(boardCollaborators.userId, userId)))
        .limit(1)

      if (collab) {
        accessLevel = collab.accessLevel
      }
    }

    // If board is public, anyone can view
    if (!accessLevel && board.isPublic) {
      accessLevel = 'viewer'
    }

    if (!accessLevel) {
      return { success: false, error: 'Access denied' }
    }

    return {
      success: true,
      board: {
        id: board.id,
        name: board.name,
        canvasData: board.canvasData,
        shareLink: board.shareLink,
        isPublic: board.isPublic,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      },
      accessLevel,
    }
  })

// Update board
export const updateBoard = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      token: string
      boardId: string
      name?: string
      canvasData?: object
      isPublic?: boolean
    }) => data
  )
  .handler(async ({ data }) => {
    const { token, boardId, name, canvasData, isPublic } = data

    const userId = await getUserIdFromToken(token)
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check access (must be owner or editor)
    const [board] = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1)

    if (!board) {
      return { success: false, error: 'Board not found' }
    }

    const isOwner = userId === board.ownerId
    let canEdit = isOwner

    if (!isOwner) {
      const [collab] = await db
        .select()
        .from(boardCollaborators)
        .where(and(eq(boardCollaborators.boardId, boardId), eq(boardCollaborators.userId, userId)))
        .limit(1)

      canEdit = collab?.accessLevel === 'editor' || collab?.accessLevel === 'admin'
    }

    if (!canEdit) {
      return { success: false, error: 'Access denied' }
    }

    // Update board
    const [updatedBoard] = await db
      .update(boards)
      .set({
        name: name ?? undefined,
        canvasData: canvasData ?? undefined,
        isPublic: isPublic ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(boards.id, boardId))
      .returning()

    return {
      success: true,
      board: {
        id: updatedBoard.id,
        name: updatedBoard.name,
        shareLink: updatedBoard.shareLink,
        isPublic: updatedBoard.isPublic,
        updatedAt: updatedBoard.updatedAt,
      },
    }
  })

// Delete board (owner only)
export const deleteBoard = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string; boardId: string }) => data)
  .handler(async ({ data }) => {
    const { token, boardId } = data

    const userId = await getUserIdFromToken(token)
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check ownership
    const [board] = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1)

    if (!board) {
      return { success: false, error: 'Board not found' }
    }

    if (board.ownerId !== userId) {
      return { success: false, error: 'Only the owner can delete this board' }
    }

    await db.delete(boards).where(eq(boards.id, boardId))

    return { success: true }
  })

// Add collaborator to board
export const addCollaborator = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { token: string; boardId: string; email: string; accessLevel: 'viewer' | 'editor' | 'admin' }) =>
      data
  )
  .handler(async ({ data }) => {
    const { token, boardId, email, accessLevel } = data

    const userId = await getUserIdFromToken(token)
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if user is owner or admin
    const [board] = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1)

    if (!board) {
      return { success: false, error: 'Board not found' }
    }

    const isOwner = userId === board.ownerId
    let canManage = isOwner

    if (!isOwner) {
      const [collab] = await db
        .select()
        .from(boardCollaborators)
        .where(and(eq(boardCollaborators.boardId, boardId), eq(boardCollaborators.userId, userId)))
        .limit(1)

      canManage = collab?.accessLevel === 'admin'
    }

    if (!canManage) {
      return { success: false, error: 'Access denied' }
    }

    // Find user by email
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    if (targetUser.id === board.ownerId) {
      return { success: false, error: 'Cannot add owner as collaborator' }
    }

    // Check if already a collaborator
    const [existing] = await db
      .select()
      .from(boardCollaborators)
      .where(
        and(eq(boardCollaborators.boardId, boardId), eq(boardCollaborators.userId, targetUser.id))
      )
      .limit(1)

    if (existing) {
      // Update access level
      await db
        .update(boardCollaborators)
        .set({ accessLevel })
        .where(eq(boardCollaborators.id, existing.id))
    } else {
      // Add new collaborator
      await db.insert(boardCollaborators).values({
        boardId,
        userId: targetUser.id,
        accessLevel,
      })
    }

    return {
      success: true,
      collaborator: {
        userId: targetUser.id,
        email: targetUser.email,
        displayName: targetUser.displayName,
        accessLevel,
      },
    }
  })

// Remove collaborator from board
export const removeCollaborator = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string; boardId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const { token, boardId, userId: targetUserId } = data

    const userId = await getUserIdFromToken(token)
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if user is owner or admin
    const [board] = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1)

    if (!board) {
      return { success: false, error: 'Board not found' }
    }

    const isOwner = userId === board.ownerId
    let canManage = isOwner

    if (!isOwner) {
      const [collab] = await db
        .select()
        .from(boardCollaborators)
        .where(and(eq(boardCollaborators.boardId, boardId), eq(boardCollaborators.userId, userId)))
        .limit(1)

      canManage = collab?.accessLevel === 'admin'
    }

    if (!canManage) {
      return { success: false, error: 'Access denied' }
    }

    await db
      .delete(boardCollaborators)
      .where(
        and(eq(boardCollaborators.boardId, boardId), eq(boardCollaborators.userId, targetUserId))
      )

    return { success: true }
  })

// Get board collaborators
export const getBoardCollaborators = createServerFn({ method: 'GET' })
  .inputValidator((data: { token: string; boardId: string }) => data)
  .handler(async ({ data }) => {
    const { token, boardId } = data

    const userId = await getUserIdFromToken(token)
    if (!userId) {
      return { success: false, error: 'Not authenticated', collaborators: [] }
    }

    // Check access
    const [board] = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1)

    if (!board) {
      return { success: false, error: 'Board not found', collaborators: [] }
    }

    const hasAccess =
      board.ownerId === userId ||
      (await db
        .select()
        .from(boardCollaborators)
        .where(and(eq(boardCollaborators.boardId, boardId), eq(boardCollaborators.userId, userId)))
        .limit(1)
        .then((r) => r.length > 0))

    if (!hasAccess) {
      return { success: false, error: 'Access denied', collaborators: [] }
    }

    // Get owner
    const [owner] = await db.select().from(users).where(eq(users.id, board.ownerId)).limit(1)

    // Get collaborators
    const collabs = await db
      .select({
        userId: users.id,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        accessLevel: boardCollaborators.accessLevel,
      })
      .from(boardCollaborators)
      .innerJoin(users, eq(boardCollaborators.userId, users.id))
      .where(eq(boardCollaborators.boardId, boardId))

    return {
      success: true,
      owner: {
        userId: owner.id,
        email: owner.email,
        displayName: owner.displayName,
        avatarUrl: owner.avatarUrl,
      },
      collaborators: collabs,
    }
  })
