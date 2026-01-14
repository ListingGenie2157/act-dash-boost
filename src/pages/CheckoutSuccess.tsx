import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simulate verification delay
    // In a real app, you might verify the session with your backend
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        {isVerifying ? (
          <Card>
            <CardContent className="pt-8 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-4" />
              <p className="text-gray-600 text-center">Verifying your payment...</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
              <CardDescription>Your order has been confirmed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Thank you for your purchase! Your account has been activated.</p>
                  {sessionId && (
                    <p className="text-xs text-gray-500 font-mono break-all">
                      Session ID: {sessionId}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-700 text-center text-sm">
                  A confirmation email has been sent to your email address with order details and next steps.
                </p>

                <div className="space-y-2">
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Go to Dashboard
                  </Button>

                  <Button 
                    onClick={() => navigate('/')}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    Back to Home
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 text-sm text-gray-600">
                <p className="font-semibold mb-2">Need help?</p>
                <p>If you have any questions, please contact us at <a href="mailto:support@example.com" className="text-blue-600 hover:underline">support@example.com</a></p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
