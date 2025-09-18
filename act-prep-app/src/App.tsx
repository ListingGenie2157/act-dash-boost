import React from 'react'
import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { useAppStore } from './stores/useAppStore'

// Pages
import { SignIn } from './pages/auth/SignIn'
import { SignUp } from './pages/auth/SignUp'
import { Dashboard } from './pages/Dashboard'
import { OnboardingWizard } from './components/onboarding/OnboardingWizard'
import { TimedSection } from './pages/practice/TimedSection'
import { Review } from './pages/Review'
import { AdminImport } from './pages/admin/Import'

// Create a root route
const rootRoute = createRootRoute({
  component: () => <div id="root-outlet" />
})

// Create routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
})

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/signin',
  component: SignIn,
})

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/signup',
  component: SignUp,
})

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingWizard,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
})

const timedSectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/practice/timed',
  component: TimedSection,
})

const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/review',
  component: Review,
})

const adminImportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/import',
  component: AdminImport,
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  signInRoute,
  signUpRoute,
  onboardingRoute,
  dashboardRoute,
  timedSectionRoute,
  reviewRoute,
  adminImportRoute,
])

// Create the router
const router = createRouter({ routeTree })

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Declare module for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const { preferences } = useAppStore()

  React.useEffect(() => {
    // Apply user preferences
    if (preferences.dyslexiaFont) {
      document.body.classList.add('font-dyslexic')
    } else {
      document.body.classList.remove('font-dyslexic')
    }

    if (preferences.reducedMotion) {
      document.body.style.setProperty('--animation-duration', '0.01ms')
    } else {
      document.body.style.removeProperty('--animation-duration')
    }
  }, [preferences])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App