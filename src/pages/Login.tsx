import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { isValidEmail, normalizeEmail } from '@/utils/validation';

/**
 * A simple authentication page for the ACT prep app.
 *
 * This component allows users to either sign in with existing
 * credentials or create a new account. It uses Supabase for
 * authentication and will redirect to the home page on success.
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const navigate = useNavigate();

  // Clear any cached auth state on component mount
  useEffect(() => {
    const clearCachedAuth = async () => {
      if (import.meta.env.DEV) {
        console.log('Clearing cached auth state...');
        console.log('Supabase client config:', {
          url: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
          key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        });
      }
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    };
    clearCachedAuth();
  }, []);

  // Check for existing session and redirect if authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (import.meta.env.DEV) console.log('User already authenticated, redirecting...');
          navigate('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, [navigate]);

  // Handles form submission for both sign‑in and sign‑up flows.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (import.meta.env.DEV) console.log('Attempting authentication...', { isSignUp, email: normalizedEmail });
    
    try {
      if (isSignUp) {
        // Attempt to create a new account
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (import.meta.env.DEV) console.log('Signup response:', { data, error: signUpError });
        if (signUpError) {
          console.error('Signup error:', signUpError);
          setError(`Signup failed: ${signUpError.message}`);
          setLoading(false);
          return;
        }
        // Show success message instead of trying to sign in immediately
        setSignUpSuccess(true);
        setEmail(normalizedEmail);
        setLoading(false);
        return;
      }

      // Sign in with the provided credentials
      if (import.meta.env.DEV) console.log('Attempting sign in with:', { email: normalizedEmail, passwordLength: password.length });
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (import.meta.env.DEV) console.log('Sign in response:', { data: signInData, error: signInError });

      if (signInError) {
        console.error('Sign in error:', signInError);
        setError(`Login failed: ${signInError.message}`);
        setLoading(false);
        return;
      }

      if (!signInData?.user) {
        setError('Login failed: No user returned from authentication.');
        setLoading(false);
        return;
      }

      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('test_date')
        .eq('id', signInData.user.id)
        .maybeSingle();
      
      if (!profile?.test_date) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Show success message after signup
  if (signUpSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 w-full max-w-md space-y-6 shadow-medium">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Check Your Email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation link to <strong>{email}</strong>.
              Click the link in your email to activate your account, then come back to sign in.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSignUpSuccess(false);
                setIsSignUp(false);
                setEmail('');
                setPassword('');
              }}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 w-full max-w-md space-y-6 shadow-medium">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">
            {isSignUp ? 'Create an Account' : 'Sign In'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? 'Enter your details to create your account'
              : 'Enter your email and password to continue'}
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>
        <div className="text-center text-sm">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="underline text-primary"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="underline text-primary"
              >
                Create one
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Login;
