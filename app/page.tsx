import { redirect } from 'next/navigation'

/**
 * Root page — middleware handles redirect to /login or /dashboard
 * This is a fallback in case middleware misses it
 */
export default function RootPage() {
  redirect('/login')
}
