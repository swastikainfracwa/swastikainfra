import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Terms of Service | Swastika Infrastructures',
  description: 'Read the terms and conditions for using Swastika Infrastructures platform.',
};

export default function TermsOfServicePage() {
  return (
    <main className="flex-1">
      {/* Breadcrumb */}
      <div className="bg-card border-b">
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">Terms of Service</span>
          </nav>
        </div>
      </div>

      <div className="container py-12 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: February 11, 2026</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing or using the Swastika Infrastructures platform, you agree to be bound by 
                  these Terms of Service and all applicable laws and regulations. If you do not agree with 
                  any of these terms, you are prohibited from using this platform.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">2. Use License</h2>
                <p className="text-muted-foreground">
                  Permission is granted to temporarily access the platform for personal, non-commercial 
                  transitory viewing only. This is the grant of a license, not a transfer of title, and 
                  under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to decompile or reverse engineer any software</li>
                  <li>Remove any copyright or proprietary notations</li>
                  <li>Transfer the materials to another person</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">3. User Accounts</h2>
                <p className="text-muted-foreground">
                  When you create an account with us, you must provide accurate, complete, and current 
                  information. Failure to do so constitutes a breach of the Terms. You are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">4. Property Listings</h2>
                <p className="text-muted-foreground">
                  When listing a property on our platform, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>You have the legal right to list the property</li>
                  <li>All information provided is accurate and truthful</li>
                  <li>You will not engage in fraudulent or misleading practices</li>
                  <li>You consent to verification of property documents by our team</li>
                  <li>You understand that listings are subject to approval</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">5. Verification Process</h2>
                <p className="text-muted-foreground">
                  Swastika Infrastructures reserves the right to verify property listings and may request 
                  additional documentation. We may reject, remove, or suspend listings that do not meet our 
                  standards or violate these terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">6. Prohibited Activities</h2>
                <p className="text-muted-foreground">
                  You may not use the platform to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Post false, inaccurate, or misleading information</li>
                  <li>Impersonate any person or entity</li>
                  <li>Interfere with or disrupt the platform</li>
                  <li>Harvest or collect user information</li>
                  <li>Transmit any viruses or malicious code</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">7. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  The platform and its original content, features, and functionality are owned by Swastika 
                  Infrastructures and are protected by international copyright, trademark, and other 
                  intellectual property laws.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">8. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  Swastika Infrastructures acts as a platform connecting property owners, agents, and buyers. 
                  We are not responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>The accuracy of property listings</li>
                  <li>Transactions between users</li>
                  <li>Disputes arising from property deals</li>
                  <li>Any damages arising from use of the platform</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">9. Disclaimer</h2>
                <p className="text-muted-foreground">
                  The platform is provided "as is" without warranties of any kind. We do not guarantee 
                  that the service will be uninterrupted, secure, or error-free. Users should conduct 
                  their own due diligence before making any property transactions.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">10. Termination</h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account and access to the platform immediately, without 
                  prior notice, for any reason, including breach of these Terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">11. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. We will notify users of any 
                  material changes. Your continued use of the platform after changes constitutes acceptance 
                  of the new terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">12. Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with the laws of India, 
                  without regard to its conflict of law provisions.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-display font-semibold">13. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms of Service, please contact us:
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
