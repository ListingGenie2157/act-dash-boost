import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrderItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceId: string;
  quantity: number;
  image?: string;
}

interface CheckoutPreviewProps {
  items?: OrderItem[];
  mode?: 'payment' | 'subscription' | 'setup';
}

export default function CheckoutPreview({ 
  items = [
    {
      id: 'premium_subscription',
      name: 'Premium Subscription',
      description: 'Full access to all courses and practice tests',
      price: 29.99,
      priceId: 'price_1SnKvWHbxXIIVcSvGKZY0X5O', // Replace with your actual price ID
      quantity: 1,
    }
  ],
  mode = 'payment'
}: CheckoutPreviewProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax rate - adjust as needed
  const total = subtotal + tax;

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = window.location.origin;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            lineItems: items.map(item => ({
              price: item.priceId,
              quantity: item.quantity,
            })),
            mode,
            successUrl: `${baseUrl}/checkout-success`,
            cancelUrl: `${baseUrl}/checkout-cancel`,
            metadata: {
              items: items.map(i => i.name).join(', '),
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Preview</h1>
          <p className="text-gray-600">Review your order before proceeding to payment</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>
              {mode === 'subscription' && 'Recurring payment'}
              {mode === 'payment' && 'One-time payment'}
              {mode === 'setup' && 'Payment method setup'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between pb-4 border-b last:border-b-0">
                  <div className="flex items-start gap-4">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}

              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button 
            onClick={handleCheckout}
            disabled={isLoading}
            size="lg"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed to Checkout'
            )}
          </Button>

          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            Continue Shopping
          </Button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Your payment is processed securely by Stripe. We never store your card information.
        </p>
      </div>
    </div>
  );
}
