import React from 'react';
import { ArrowLeft, Lightbulb, Target, AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const BestPractices: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/documentation')}
            className="flex items-center text-soft-lavender/70 hover:text-electric-cyan transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documentation
          </button>

          <div className="bg-card-bg rounded-lg p-8 border border-border-color">
            <h1 className="text-3xl font-bold text-soft-lavender mb-6">Best Practices for AI Art</h1>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-electric-cyan" />
                  Core Principles
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <p>
                    Follow these fundamental principles to create better AI art:
                  </p>
                  <div className="bg-deep-bg rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">1. Clarity is Key</h3>
                      <p>Be specific and detailed in your descriptions. Avoid vague or ambiguous terms.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">2. Less is More</h3>
                      <p>Don't overcomplicate prompts. Focus on the most important elements.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">3. Consistency Matters</h3>
                      <p>Ensure all elements in your prompt work together harmoniously.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-electric-cyan" />
                  Optimization Techniques
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <p>
                    Optimize your prompts for better results:
                  </p>
                  <div className="bg-deep-bg rounded-lg p-6 space-y-4">
                    <ul className="list-disc pl-6 space-y-3">
                      <li>
                        <strong className="text-soft-lavender">Use Strong Descriptors:</strong>
                        <p>Choose specific, vivid adjectives over generic ones.</p>
                      </li>
                      <li>
                        <strong className="text-soft-lavender">Balance Details:</strong>
                        <p>Include enough detail to guide the AI without overwhelming it.</p>
                      </li>
                      <li>
                        <strong className="text-soft-lavender">Maintain Context:</strong>
                        <p>Ensure all elements of your prompt support the main concept.</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-electric-cyan" />
                  Common Pitfalls
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <p>
                    Avoid these common mistakes:
                  </p>
                  <div className="bg-deep-bg rounded-lg p-6 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-medium text-soft-lavender mb-2">Overcomplication</h3>
                        <p>Don't try to include too many elements or conflicting styles.</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-soft-lavender mb-2">Vague Instructions</h3>
                        <p>Avoid general terms like "nice" or "good" - be specific about what you want.</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-soft-lavender mb-2">Contradictory Elements</h3>
                        <p>Ensure your style, mood, and technical specifications align.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-electric-cyan" />
                  Tips for Success
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <div className="bg-deep-bg rounded-lg p-6">
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">1</span>
                        <span>Start with a clear vision of what you want to create</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">2</span>
                        <span>Test and iterate your prompts to refine results</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">3</span>
                        <span>Keep a library of successful prompts for reference</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">4</span>
                        <span>Study and learn from other artists' successful prompts</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPractices;