import { useState } from 'react'
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
import { login, register } from '@/server/functions/auth'
import { LogIn, UserPlus, Loader2 } from 'lucide-react'

type AuthMode = 'login' | 'register'

export function AuthDialog() {
  const { user, setUser, setToken, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const result = await login({ data: { email, password } })
        if (result.success && result.user && result.session) {
          setUser(result.user)
          setToken(result.session.token)
          setOpen(false)
          resetForm()
        } else {
          setError(result.error || 'Login failed')
        }
      } else {
        const result = await register({
          data: { email, password, displayName: displayName || undefined },
        })
        if (result.success && result.user && result.session) {
          setUser(result.user)
          setToken(result.session.token)
          setOpen(false)
          resetForm()
        } else {
          setError(result.error || 'Registration failed')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setDisplayName('')
    setError('')
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  // If user is logged in, show user menu
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-primary-foreground">
            {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium hidden md:inline">
            {user.displayName || user.email.split('@')[0]}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'login'
                ? 'Sign in to save and share your boards.'
                : 'Create an account to collaborate with others.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={switchMode}
              className="sm:mr-auto"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'login' ? (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
