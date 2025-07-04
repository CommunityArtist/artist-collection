import React from 'react';
import { Folder, Share2, Wand2 } from 'lucide-react';
import { FeatureProps } from '../types';

const FeatureCard: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-card-bg p-8 rounded-lg border border-border-color hover:border-cosmic-purple/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-glow">
      <div className="mb-6 w-12 h-12 rounded-full bg-deep-bg flex items-center justify-center text-electric-cyan">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-soft-lavender mb-3">{title}</h3>
      <p className="text-soft-lavender/70">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Folder className="w-6 h-6" />,
      title: "Organize",
      description: "Create collections, categorize prompts, and build your personal library for different AI tools and platforms."
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "Share",
      description: "Exchange prompts with the community, collaborate with others, and discover new techniques."
    },
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: "Create",
      description: "Build powerful prompts with our template system, variables, and advanced formatting options."
    }
  ];
  
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-electric-cyan">Supercharge</span>
            <span className="text-soft-lavender"> Your AI Workflow</span>
          </h2>
          <p className="text-soft-lavender/70 text-lg max-w-2xl mx-auto">
            Our platform provides everything you need to create, organize, and share powerful AI prompts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;