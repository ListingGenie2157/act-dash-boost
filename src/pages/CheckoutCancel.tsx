import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card className="border-amber-200 bg-white">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-amber-700">Checkout Canceled</CardTitle>
            <CardDescription>Your payment was not completed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-gray-700 text-sm">
                No charges have been made to your account. You can try again whenever you're ready.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-gray-600 text-center text-sm">
                Forgot to add something to your cart? Shop around and come back to complete your purchase.
              </p>

              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/checkout')}
                  size="lg"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Try Again
                </Button>

                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-semibold mb-1">Why checkout didn't complete?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Payment information was incorrect</li>
                  <li>Your card was declined</li>
                  <li>You chose to cancel the transaction</li>
                </ul>
              </div>

              <p>
                Need help? Contact us at <a href="mailto:support@example.com" className="text-blue-600 hover:underline">support@example.com</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
