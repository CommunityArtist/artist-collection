import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-card-bg rounded-lg p-8 border border-border-color">
          <h1 className="text-3xl font-bold text-soft-lavender mb-6">Privacy Policy</h1>
          
          <div className="space-y-6 text-soft-lavender/70">
            <p>Last updated: March 15, 2025</p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">Introduction</h2>
              <p>
                At Community Artists, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our website and services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-soft-lavender">Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Email address</li>
                    <li>Username</li>
                    <li>Profile information</li>
                    <li>Content you create and share</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-soft-lavender">Usage Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Log data</li>
                    <li>Device information</li>
                    <li>Usage patterns</li>
                    <li>Performance data</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and maintain our services</li>
                <li>To notify you about changes to our services</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">Data Security</h2>
              <p>
                We implement appropriate technical and organizational security measures to protect your personal 
                information. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">Your Rights</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-soft-lavender">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at privacy@communityartist.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;