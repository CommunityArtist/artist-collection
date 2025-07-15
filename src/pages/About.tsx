import React from 'react';
import { Users, Sparkles, Globe2 } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-soft-lavender mb-4">About Community Artist</h1>
            <p className="text-soft-lavender/70 text-lg">
              Empowering creators with AI-powered tools and a vibrant community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="w-12 h-12 bg-cosmic-purple/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-cosmic-purple" />
              </div>
              <h3 className="text-xl font-semibold text-soft-lavender mb-2">Our Community</h3>
              <p className="text-soft-lavender/70">
                A diverse network of artists, creators, and innovators sharing knowledge and inspiration.
              </p>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="w-12 h-12 bg-electric-cyan/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-electric-cyan" />
              </div>
              <h3 className="text-xl font-semibold text-soft-lavender mb-2">Our Mission</h3>
              <p className="text-soft-lavender/70">
                To democratize AI art creation and foster a collaborative creative environment.
              </p>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="w-12 h-12 bg-neon-pink/10 rounded-lg flex items-center justify-center mb-4">
                <Globe2 className="w-6 h-6 text-neon-pink" />
              </div>
              <h3 className="text-xl font-semibold text-soft-lavender mb-2">Our Vision</h3>
              <p className="text-soft-lavender/70">
                To shape the future of digital art through accessible AI technology.
              </p>
            </div>
          </div>

          <div className="bg-card-bg rounded-lg p-8 border border-border-color mb-16">
            <h2 className="text-2xl font-bold text-soft-lavender mb-6">Our Story</h2>
            <div className="space-y-4 text-soft-lavender/70">
              <p>
                Founded in 2025, Community Artist emerged from a simple idea: making AI art creation accessible to everyone. 
                What started as a small group of enthusiasts has grown into a global community of creators pushing the 
                boundaries of digital art.
              </p>
              <p>
                Our platform combines cutting-edge AI technology with intuitive tools, enabling artists of all skill levels 
                to bring their creative visions to life. We believe in the power of community-driven innovation and the 
                endless possibilities that arise when technology meets creativity.
              </p>
              <p>
                Today, we continue to evolve and innovate, guided by our commitment to fostering creativity, collaboration, 
                and artistic expression in the digital age.
              </p>
            </div>
          </div>

          <div className="bg-card-bg rounded-lg p-8 border border-border-color">
            <h2 className="text-2xl font-bold text-soft-lavender mb-6">Join Our Community</h2>
            <p className="text-soft-lavender/70 mb-8">
              Whether you're an experienced artist or just starting your creative journey, there's a place for you in our 
              community. Join us in shaping the future of AI-powered digital art.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-deep-bg rounded-lg border border-border-color">
                <h3 className="text-xl font-semibold text-soft-lavender mb-3">For Artists</h3>
                <ul className="space-y-2 text-soft-lavender/70">
                  <li>• Access to advanced AI art tools</li>
                  <li>• Share your work with the community</li>
                  <li>• Collaborate with other creators</li>
                  <li>• Get inspired by diverse artwork</li>
                </ul>
              </div>
              <div className="p-6 bg-deep-bg rounded-lg border border-border-color">
                <h3 className="text-xl font-semibold text-soft-lavender mb-3">For Innovators</h3>
                <ul className="space-y-2 text-soft-lavender/70">
                  <li>• Experiment with AI technology</li>
                  <li>• Contribute to feature development</li>
                  <li>• Participate in beta testing</li>
                  <li>• Shape the future of AI art</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;