import { supabase } from '@/integrations/supabase/client';

/**
 * Get the time multiplier for the current user's accommodations
 * Returns 1.0 for no accommodations, 1.5 for 50% extra time, 2.0 for 100% extra time
 */
export async function getTimeMultiplier(): Promise<number> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return 1.0; // Default to no accommodations if not authenticated
    }

    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('time_multiplier')
      .eq('user_id', session.user.id)
      .single();

    return accommodation?.time_multiplier || 1.0;
  } catch (error) {
    console.error('Error fetching time multiplier:', error);
    return 1.0; // Default to no accommodations on error
  }
}

/**
 * Apply time multiplier to a base time in seconds
 */
export function applyTimeMultiplier(baseTimeSeconds: number, multiplier: number): number {
  return Math.round(baseTimeSeconds * multiplier);
}

/**
 * Get accommodation-adjusted time for the current user
 */
export async function getAccommodatedTime(baseTimeSeconds: number): Promise<number> {
  const multiplier = await getTimeMultiplier();
  return applyTimeMultiplier(baseTimeSeconds, multiplier);
}