import { Link, Outlet } from 'react-router-dom'

export function AppLayout() {
	return (
		<div className="min-h-screen bg-white text-gray-900">
			<header className="border-b sticky top-0 bg-white/80 backdrop-blur">
				<div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
					<Link to="/" className="font-semibold">ACT Prep</Link>
					<nav className="text-sm space-x-4">
						<Link to="/">Dashboard</Link>
						<Link to="/review">Review</Link>
						<Link to="/diagnostic">Diagnostic</Link>
					</nav>
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-4 py-6">
				<Outlet />
			</main>
		</div>
	)
}