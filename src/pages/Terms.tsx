import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 25, 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Preppit Pacing ("the Service"), you agree to be bound by these 
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Preppit Pacing is an ACT test preparation platform that provides practice questions, 
            study plans, diagnostic assessments, and personalized learning tools to help students 
            prepare for the ACT examination.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            To use certain features of the Service, you must create an account. You are responsible 
            for maintaining the confidentiality of your account credentials and for all activities 
            that occur under your account.
          </p>
          <ul>
            <li>You must be at least 13 years of age to create an account</li>
            <li>You must provide accurate and complete information when creating your account</li>
            <li>You are responsible for keeping your password secure</li>
            <li>You must notify us immediately of any unauthorized access to your account</li>
          </ul>

          <h2>4. Subscription and Payments</h2>
          <p>
            Some features of the Service require a paid subscription. Payment is processed through 
            Stripe. By subscribing, you agree to the following:
          </p>
          <ul>
            <li>Subscription fees are billed in advance on a recurring basis</li>
            <li>You authorize us to charge your payment method for the applicable fees</li>
            <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
            <li>Refunds are provided at our discretion and in accordance with our refund policy</li>
          </ul>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Share your account credentials with others</li>
            <li>Copy, distribute, or reproduce any content from the Service</li>
            <li>Attempt to access other users' accounts or data</li>
            <li>Use automated tools to access the Service</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use the Service for any unlawful purpose</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            All content on the Service, including but not limited to questions, explanations, 
            study materials, and software, is the property of Preppit Pacing or its licensors 
            and is protected by copyright and other intellectual property laws.
          </p>

          <h2>7. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR 
            IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, 
            OR THAT ANY SPECIFIC SCORE IMPROVEMENT WILL BE ACHIEVED.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, PREPPIT PACING SHALL NOT BE LIABLE FOR ANY 
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF 
            YOUR USE OF THE SERVICE.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of 
            material changes by posting the updated Terms on the Service. Your continued use 
            of the Service after such changes constitutes acceptance of the new Terms.
          </p>

          <h2>10. Termination</h2>
          <p>
            We may terminate or suspend your account at any time for violation of these Terms 
            or for any other reason at our sole discretion. Upon termination, your right to 
            use the Service will immediately cease.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the 
            United States, without regard to its conflict of law provisions.
          </p>

          <h2>12. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> support@getpreppit.com
          </p>
        </article>
      </div>
    </div>
  );
}
