'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        // Map common Supabase errors to user-friendly messages
        if (error.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials.')
        } else if (error.includes('Email not confirmed')) {
          setError('Please verify your email address before logging in.')
        } else {
          setError(error)
        }
        return
      }

      // Successful login - role redirect handled by middleware
      // But we do an explicit push here for immediate feedback
      // The middleware will handle the final redirect on next navigation
      router.push('/')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#2D7FF9] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-white text-xl font-bold">AdCure</span>
        </div>
        <p className="text-[#94A3B8] text-sm">Client Portal</p>
      </div>

      <Card className="bg-[#1A1F2B] border-[#2A3040] text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-white">Welcome back</CardTitle>
          <CardDescription className="text-[#94A3B8]">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#94A3B8] text-sm">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-[#0A0E14] border-[#2A3040] text-white placeholder:text-[#4A5568] focus:border-[#2D7FF9] focus:ring-[#2D7FF9]"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#94A3B8] text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-[#0A0E14] border-[#2A3040] text-white placeholder:text-[#4A5568] focus:border-[#2D7FF9] focus:ring-[#2D7FF9]"
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2D7FF9] hover:bg-[#1E6FE8] text-white font-medium h-10 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Support Info */}
          <p className="mt-6 text-center text-xs text-[#94A3B8]">
            Need help?{' '}
            <a
              href="mailto:service@adcure.agency"
              className="text-[#2D7FF9] hover:underline"
            >
              Contact support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
