import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { DashboardPage } from './routes/DashboardPage'
import { OnboardingPage } from './routes/OnboardingPage'
import { DiagnosticPage } from './routes/DiagnosticPage'
import { ReviewPage } from './routes/ReviewPage'
import { TimedSectionPage } from './routes/TimedSectionPage'
import { AdminImportPage } from './routes/AdminImportPage'
import { AuthPage } from './routes/AuthPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <AppLayout />,
		children: [
			{
				index: true,
				element: (
					<ProtectedRoute>
						<DashboardPage />
					</ProtectedRoute>
				),
			},
			{
				path: 'onboarding',
				element: (
					<ProtectedRoute>
						<OnboardingPage />
					</ProtectedRoute>
				),
			},
			{
				path: 'diagnostic',
				element: (
					<ProtectedRoute>
						<DiagnosticPage />
					</ProtectedRoute>
				),
			},
			{
				path: 'review',
				element: (
					<ProtectedRoute>
						<ReviewPage />
					</ProtectedRoute>
				),
			},
			{
				path: 'timed/:formId/:section',
				element: (
					<ProtectedRoute>
						<TimedSectionPage />
					</ProtectedRoute>
				),
			},
			{
				path: 'admin/import',
				element: (
					<ProtectedRoute requireAdmin>
						<AdminImportPage />
					</ProtectedRoute>
				),
			},
			{ path: 'auth', element: <AuthPage /> },
			{ path: '*', element: <Navigate to="/" replace /> },
		],
	},
])