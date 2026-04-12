'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { type User, type Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { type AppUser, type UserRole } from '@/types/database.types'

// =====================================================
// Auth Context Types
// =====================================================

interface AuthContextValue {
  /** Supabase auth user (raw) */
  user: User | null
  /** Enriched app user with role + org info */
  appUser: AppUser | null
  /** Current session */
  session: Session | null
  /** Loading state during initial session check */
  loading: boolean
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  /** Sign out and clear session */
  signOut: () => Promise<void>
  /** User's role (shortcut) */
  role: UserRole | null
  /** Whether user is agency admin */
  isAdmin: boolean
}

// =====================================================
// Context
// =====================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// =====================================================
// Provider
// =====================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  /**
   * Fetch the enriched app user from the users table.
   * This gives us role, organization_id, etc.
   */
  const fetchAppUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, company_name, role, organization_id')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.error('[AuthProvider] Failed to fetch user profile:', error?.message)
      return null
    }

    // Cast data since Supabase may infer narrow types from the select string
    const profile = data as {
      id: string
      email: string
      full_name: string | null
      phone: string | null
      company_name: string | null
      role: 'client' | 'agency_admin'
      organization_id: string
    }

    const appUser: AppUser = {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      phone: profile.phone,
      companyName: profile.company_name,
      role: profile.role,
      organizationId: profile.organization_id,
    }

    return appUser
  }, [supabase])

  /**
   * Initialize auth state on mount.
   * Check for existing session in cookies/localStorage.
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setSession(session)
          setUser(session.user)
          const profile = await fetchAppUser(session.user.id)
          setAppUser(profile)
        }
      } catch (error) {
        console.error('[AuthProvider] Session init error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const profile = await fetchAppUser(session.user.id)
          setAppUser(profile)
        } else {
          setAppUser(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchAppUser])

  /**
   * Sign in with email and password.
   * Returns error message or null on success.
   */
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch {
      return { error: 'An unexpected error occurred. Please try again.' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign out and clear all state.
   */
  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setAppUser(null)
    setSession(null)
    setLoading(false)
  }

  const role = appUser?.role ?? null
  const isAdmin = role === 'agency_admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        session,
        loading,
        signIn,
        signOut,
        role,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// =====================================================
// Hook
// =====================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
