import { createFileRoute, redirect } from '@tanstack/react-router'
import { AUTH_COOKIE_KEY, ROUTES } from '@/constants'
import { useAuthStore } from '@/stores/auth-store'
import { getCookie } from '@/lib/cookies'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

function isSessionAlive(): boolean {
  return !!getCookie(AUTH_COOKIE_KEY)
}

function redirectToSignIn(from: string): never {
  throw redirect({
    to: ROUTES.SIGN_IN,
    search: { redirect: from },
  })
}

async function requireAuth({ location }: { location: { href: string } }) {
  const { auth } = useAuthStore.getState()

  if (!isSessionAlive()) {
    auth.reset()
    redirectToSignIn(location.href)
  }

  if (!auth.user) {
    try {
      await auth.fetchUser()
    } catch {
      redirectToSignIn(location.href)
    }
  }
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: requireAuth,
  component: AuthenticatedLayout,
})
