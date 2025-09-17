import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
    })
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  return session
}