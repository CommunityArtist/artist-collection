import React from 'react';

const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-card-bg rounded-lg p-8 border border-border-color">
          <h1 className="text-3xl font-bold text-soft-lavender mb-6">Cookie Policy</h1>
          
          <div className="space-y-6 text-soft-lavender/70">
            <p>Last updated: March 15, 2025</p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">What Are Cookies</h2>
              <p>
                Cookies are small text files that are stored on your computer or mobile device when you visit our website. 
                They help us make your experience better by remembering your preferences and how you use our site.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">How We Use Cookies</h2>
              <p>We use cookies for several purposes, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Authentication and security</li>
                <li>Preferences and settings</li>
                <li>Analytics and performance</li>
                <li>Feature functionality</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-soft-lavender">Essential Cookies</h3>
                  <p>Required for the website to function properly. You can't opt out of these cookies.</p>
                </div>
                <div>
                  <h3 className="font-medium text-soft-lavender">Analytics Cookies</h3>
                  <p>Help us understand how visitors interact with our website.</p>
                </div>
                <div>
                  <h3 className="font-medium text-soft-lavender">Functional Cookies</h3>
                  <p>Remember your preferences and settings.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">Managing Cookies</h2>
              <p>
                Most web browsers allow you to control cookies through their settings. You can usually find 
                these settings in the "options" or "preferences" menu of your browser.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">Contact Us</h2>
              <p>
                If you have any questions about our Cookie Policy, please contact us at privacy@communityartists.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;