import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * Simplified login page for debugging
 */
export default function SimpleLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });

        if (error) {
          setMessage(`❌ Signup Error: ${error.message}`);
        } else if (data.user) {
          setMessage(`✅ Account created! Check email: ${email} for confirmation link.`);
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(`❌ Login Error: ${error.message}`);
        } else if (data.session) {
          setMessage('✅ Login successful! Redirecting...');
          setTimeout(() => navigate('/'), 1000);
        }
      }
    } catch (err) {
      setMessage(`❌ Unexpected error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setMessage('Testing connection...');
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setMessage(`❌ Connection Error: ${error.message}`);
      } else {
        setMessage(`✅ Connected! Session: ${data.session ? 'Active' : 'None'}`);
      }
    } catch (err) {
      setMessage(`❌ Connection failed: ${err}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
          <CardDescription>
            Simple auth for debugging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={testConnection}
          >
            🔍 Test Connection
          </Button>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Auth enabled:</strong> ✅</p>
            <p><strong>Ready to test</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
