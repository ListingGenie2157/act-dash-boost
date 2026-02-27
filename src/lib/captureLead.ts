import { isValidEmail, normalizeEmail } from '@/utils/validation';
import { reportError } from '@/lib/errorReporter';

const SUPABASE_URL = 'https://hhbkmxrzxcswwokmbtbz.supabase.co';

export interface LeadData {
  email: string;
  role?: 'student' | 'parent' | string;
  bucket?: string;
  test_date?: string;
  beta_interest?: boolean;
  source?: string;
  page_path?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

export interface CaptureLeadResult {
  ok: boolean;
  id?: string;
  created_at?: string;
  duplicate?: boolean;
  error?: string;
}

/**
 * Capture a lead by calling the edge function.
 * Automatically extracts UTM parameters if not provided.
 */
export async function captureLead(data: LeadData): Promise<CaptureLeadResult> {
  const email = normalizeEmail(data.email);
  
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Invalid email' };
  }

  // Auto-extract UTM params from URL if not provided
  const searchParams = new URLSearchParams(window.location.search);
  
  const payload = {
    email,
    role: data.role,
    bucket: data.bucket,
    test_date: data.test_date,
    beta_interest: data.beta_interest,
    source: data.source || 'landing',
    page_path: data.page_path || window.location.pathname,
    utm_source: data.utm_source ?? searchParams.get('utm_source'),
    utm_medium: data.utm_medium ?? searchParams.get('utm_medium'),
    utm_campaign: data.utm_campaign ?? searchParams.get('utm_campaign'),
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/capture-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return { ok: false, error: result.error || 'Failed to capture lead' };
    }

    return result;
  } catch (error) {
    reportError(error instanceof Error ? error : new Error(String(error)), { source: 'captureLead' });
    return { ok: false, error: 'Network error' };
  }
}
