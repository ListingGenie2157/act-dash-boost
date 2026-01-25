import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
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
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 25, 2026</p>

          <h2>1. Introduction</h2>
          <p>
            Preppit Pacing ("we", "our", or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your 
            information when you use our ACT preparation platform.
          </p>

          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
            <li><strong>Profile Information:</strong> Test preferences, study goals, and accommodations</li>
            <li><strong>Payment Information:</strong> Billing details processed securely through Stripe</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul>
            <li><strong>Usage Data:</strong> Practice session results, time spent on questions, and study progress</li>
            <li><strong>Device Information:</strong> Browser type, device type, and operating system</li>
            <li><strong>Log Data:</strong> IP address, access times, and pages viewed</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain our Service</li>
            <li>Personalize your learning experience with adaptive study plans</li>
            <li>Track your progress and identify areas for improvement</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send important updates about the Service</li>
            <li>Respond to your inquiries and provide support</li>
            <li>Improve our Service through analytics</li>
          </ul>

          <h2>4. Information Sharing</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul>
            <li><strong>Service Providers:</strong> Third parties who help us operate our Service (e.g., Stripe for payments, Supabase for data storage)</li>
            <li><strong>Parents/Guardians:</strong> If you link your account to a parent portal, your study progress may be shared with the linked parent account</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your 
            personal information, including:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication mechanisms</li>
            <li>Regular security assessments</li>
            <li>Access controls limiting who can view your data</li>
          </ul>

          <h2>6. Student Data Protection</h2>
          <p>
            We are committed to protecting student privacy and comply with applicable laws 
            including COPPA (Children's Online Privacy Protection Act) and FERPA (Family 
            Educational Rights and Privacy Act) where applicable.
          </p>
          <ul>
            <li>Users must be 13 years or older to create an account</li>
            <li>We collect only information necessary to provide educational services</li>
            <li>Student data is never used for advertising purposes</li>
            <li>We do not share student information with third parties for marketing</li>
          </ul>

          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Data Portability:</strong> Request your data in a portable format</li>
            <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
          </ul>
          <p>
            To exercise these rights, please contact us at support@getpreppit.com.
          </p>

          <h2>8. Cookies and Tracking</h2>
          <p>
            We use essential cookies to maintain your session and remember your preferences. 
            We do not use third-party advertising cookies. Analytics cookies may be used to 
            understand how you interact with our Service.
          </p>

          <h2>9. Third-Party Services</h2>
          <p>Our Service integrates with the following third-party services:</p>
          <ul>
            <li><strong>Supabase:</strong> Database and authentication services</li>
            <li><strong>Stripe:</strong> Payment processing</li>
          </ul>
          <p>
            These services have their own privacy policies, and we encourage you to review them.
          </p>

          <h2>10. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as 
            needed to provide services. You may request deletion of your account and associated 
            data at any time.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any 
            material changes by posting the new Privacy Policy on this page and updating the 
            "Last updated" date.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, please 
            contact us at:
          </p>
          <p>
            <strong>Email:</strong> support@getpreppit.com
          </p>
        </article>
      </div>
    </div>
  );
}
