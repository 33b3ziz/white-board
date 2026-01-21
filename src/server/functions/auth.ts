import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db/index'
import { users, sessions } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

// Cookie helper functions
function setSessionCookie(token: string, expiresAt: Date) {
  // This will be handled on the client side with document.cookie
  return { token, expiresAt: expiresAt.toISOString() }
}

// Register a new user
export const register = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; password: string; displayName?: string }) => data)
  .handler(async ({ data }) => {
    const { email, password, displayName } = data

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existingUser.length > 0) {
      return { success: false, error: 'Email already registered' }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName || email.split('@')[0],
      })
      .returning()

    // Create session
    const token = nanoid(64)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.insert(sessions).values({
      userId: newUser.id,
      token,
      expiresAt,
    })

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        avatarUrl: newUser.avatarUrl,
      },
      session: setSessionCookie(token, expiresAt),
    }
  })

// Login user
export const login = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { email, password } = data

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!user) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Create session
    const token = nanoid(64)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      session: setSessionCookie(token, expiresAt),
    }
  })

// Logout user
export const logout = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const { token } = data

    await db.delete(sessions).where(eq(sessions.token, token))

    return { success: true }
  })

// Get current user from session token
export const getCurrentUser = createServerFn({ method: 'GET' })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const { token } = data

    if (!token) {
      return { user: null }
    }

    // Find session and user
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1)

    if (!session) {
      return { user: null }
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user) {
      return { user: null }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    }
  })

// Update user profile
export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string; displayName?: string; avatarUrl?: string }) => data)
  .handler(async ({ data }) => {
    const { token, displayName, avatarUrl } = data

    // Verify session
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1)

    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        displayName: displayName ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.userId))
      .returning()

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
      },
    }
  })
