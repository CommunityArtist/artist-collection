import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { Sparkles, Zap } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cosmic-purple/20 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-electric-cyan/20 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-soft-lavender">Ready to </span>
            <span className="text-electric-cyan">Transform</span>
            <span className="text-soft-lavender"> Your AI Experience?</span>
          </h1>
          
          <p className="text-soft-lavender/70 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of AI enthusiasts who are optimizing their workflows with our prompt library. Create, share, and discover the perfect prompts.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/create-prompt">
              <Button 
                variant="primary" 
                size="lg"
                className="group"
              >
                <Sparkles className="mr-2 w-5 h-5 group-hover:animate-spin transition-all duration-700" />
                Add Prompt
              </Button>
            </Link>
            
            <Link to="/library">
              <Button 
                variant="outline" 
                size="lg"
                className="group"
              >
                <Zap className="mr-2 w-5 h-5 group-hover:text-electric-cyan transition-all duration-300" />
                Explore the Library
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-deep-bg to-transparent"></div>
    </section>
  );
};

export default Hero;