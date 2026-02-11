import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Privacy Policy | Swastika Infrastructures',
  description: 'Learn how Swastika Infrastructures collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-1">
      {/* Breadcrumb */}
      <div className="bg-card border-b">
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">Privacy Policy</span>
          </nav>
        </div>
      </div>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: February 11, 2026</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">1. Information We Collect</h2>
                <p className="text-muted-foreground">
                  We collect information you provide directly to us when you create an account, list a property, 
                  submit inquiries, or communicate with us. This may include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Name, email address, and phone number</li>
                  <li>Property details and images</li>
                  <li>Account credentials</li>
                  <li>Communications you send to us</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">2. How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process your property listings and inquiries</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Connect property owners with potential buyers and agents</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">3. Information Sharing</h2>
                <p className="text-muted-foreground">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>With agents assigned to your property listing</li>
                  <li>With potential buyers who express interest in your property</li>
                  <li>When required by law or to protect our rights</li>
                  <li>With your consent or at your direction</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">4. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal 
                  information against unauthorized access, alteration, disclosure, or destruction. However, 
                  no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">5. Your Rights</h2>
                <p className="text-muted-foreground">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Access and update your personal information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Request a copy of your data</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">6. Cookies</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to track activity on our service and 
                  hold certain information. You can instruct your browser to refuse all cookies or to 
                  indicate when a cookie is being sent.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">7. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">8. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <ul className="list-none space-y-2 text-muted-foreground ml-4">
                  <li>Email: info@swastikainfra.in</li>
                  <li>Phone: +91 98270 06656</li>
                </ul>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
