import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  lineItems: Array<{
    price: string;
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  mode?: 'payment' | 'subscription' | 'setup';
  customerEmail?: string;
  metadata?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CheckoutRequest = await req.json();
    
    // Validate required fields
    if (!body.lineItems || !Array.isArray(body.lineItems) || body.lineItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'lineItems is required and must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.successUrl || !body.cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'successUrl and cancelUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeApiKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Stripe configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create checkout session via Stripe API
    const checkoutSessionData: Record<string, unknown> = {
      payment_method_types: ['card'],
      line_items: body.lineItems,
      mode: body.mode || 'payment',
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
    };

    // Add optional fields if provided
    if (body.customerEmail) {
      checkoutSessionData.customer_email = body.customerEmail;
    }

    if (body.metadata) {
      checkoutSessionData.metadata = body.metadata;
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(
        Object.entries(checkoutSessionData).reduce((acc, [key, value]) => {
          if (Array.isArray(value)) {
            // Handle arrays (line_items)
            value.forEach((item, index) => {
              Object.entries(item as Record<string, unknown>).forEach(([itemKey, itemValue]) => {
                acc[`${key}[${index}][${itemKey}]`] = String(itemValue);
              });
            });
          } else if (typeof value === 'object' && value !== null) {
            // Handle objects (metadata)
            Object.entries(value).forEach(([objKey, objValue]) => {
              acc[`${key}[${objKey}]`] = String(objValue);
            });
          } else {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Stripe API error:', data);
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Failed to create checkout session' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
