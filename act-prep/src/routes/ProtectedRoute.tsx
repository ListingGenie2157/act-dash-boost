import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../hooks/useSession'

export function ProtectedRoute({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
	const session = useSession()
	const location = useLocation()

	if (session === undefined) {
		return null
	}

	if (!session) {
		return <Navigate to={{ pathname: '/auth' }} state={{ from: location }} replace />
	}

	const isAdmin = (() => {
		const roles = (session.user.app_metadata as Record<string, unknown>)?.roles as string[] | undefined
		return Array.isArray(roles) && roles.includes('admin')
	})()

	if (requireAdmin && !isAdmin) {
		return <Navigate to="/" replace />
	}

	return <>{children}</>
}