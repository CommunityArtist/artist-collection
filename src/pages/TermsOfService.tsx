import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-card-bg rounded-lg p-8 border border-border-color">
          <h1 className="text-3xl font-bold text-soft-lavender mb-6">Terms of Service</h1>
          
          <div className="space-y-6 text-soft-lavender/70">
            <p>Last updated: March 15, 2025</p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">1. Agreement to Terms</h2>
              <p>
                By accessing or using Community Artists, you agree to be bound by these Terms of Service 
                and our Privacy Policy. If you disagree with any part of the terms, you may not access our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">2. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be 13 years or older to use this service</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You are responsible for all activities under your account</li>
                <li>You must notify us of any security breach or unauthorized use</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">3. User Content</h2>
              <div className="space-y-4">
                <p>
                  You retain your rights to any content you submit, post or display on or through our services.
                  By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use,
                  copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content.
                </p>
                <p>
                  You represent and warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You own the content you post or have the right to use it</li>
                  <li>Your content doesn't violate the rights of others</li>
                  <li>Your content complies with all applicable laws</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">4. Prohibited Uses</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the service for any illegal purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Infringe upon the rights of others</li>
                <li>Interfere with or disrupt the service</li>
                <li>Attempt to bypass any security measures</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">5. Termination</h2>
              <p>
                We may terminate or suspend your account and bar access to the service immediately, 
                without prior notice or liability, under our sole discretion, for any reason whatsoever.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">6. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. We will provide 
                notice of any changes by posting the new Terms on this site.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">7. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at legal@communityartist.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;