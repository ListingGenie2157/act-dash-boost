import type { FormEvent } from 'react'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function AuthPage() {
	const [email, setEmail] = useState('')
	const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
	const [message, setMessage] = useState<string>('')

	async function onSubmit(e: FormEvent) {
		e.preventDefault()
		try {
			setStatus('sending')
			const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
			if (error) throw error
			setStatus('sent')
			setMessage('Check your email for a sign-in link.')
		} catch (err) {
			setStatus('error')
			setMessage(err instanceof Error ? err.message : 'Failed to send magic link')
		}
	}

	return (
		<div className="mx-auto max-w-md">
			<h1 className="text-2xl font-semibold mb-4">Sign in</h1>
			<p className="text-sm text-gray-600 mb-6">We use passwordless sign-in. Enter your email to receive a magic link.</p>
			<form onSubmit={onSubmit} className="space-y-4">
				<input
					type="email"
					required
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full rounded border px-3 py-2"
				/>
				<button disabled={status === 'sending'} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">
					{status === 'sending' ? 'Sending…' : 'Send magic link'}
				</button>
			</form>
			{message && <p className="mt-4 text-sm">{message}</p>}
		</div>
	)
}