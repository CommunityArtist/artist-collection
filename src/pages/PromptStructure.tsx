import React from 'react';
import { ArrowLeft, MessageSquare, Sparkles, Palette, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const PromptStructure: React.FC = () => {
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
            <h1 className="text-3xl font-bold text-soft-lavender mb-6">Understanding Prompt Structure</h1>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-electric-cyan" />
                  Basic Components
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <p>
                    A well-structured prompt is essential for generating high-quality AI art. Here are the key components:
                  </p>
                  <div className="bg-deep-bg rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">1. Subject Description</h3>
                      <p>Clear description of the main subject, including:</p>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Physical attributes</li>
                        <li>Pose and expression</li>
                        <li>Clothing and accessories</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">2. Environment</h3>
                      <p>Details about the setting:</p>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Location specifics</li>
                        <li>Time of day</li>
                        <li>Weather conditions</li>
                        <li>Surrounding elements</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">3. Style and Mood</h3>
                      <p>Artistic direction and emotional tone:</p>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Art style (e.g., realistic, anime, abstract)</li>
                        <li>Color palette</li>
                        <li>Emotional atmosphere</li>
                        <li>Lighting mood</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-electric-cyan" />
                  Advanced Techniques
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <p>
                    Enhance your prompts with these advanced techniques:
                  </p>
                  <div className="bg-deep-bg rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">Weight Modifiers</h3>
                      <p>Use parentheses to adjust emphasis:</p>
                      <code className="block bg-card-bg p-3 rounded mt-2">
                        (detailed skin texture:1.2), ((bright eyes:1.3))
                      </code>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">Negative Prompts</h3>
                      <p>Specify what you don't want:</p>
                      <code className="block bg-card-bg p-3 rounded mt-2">
                        [no blur, avoid distorted features, remove text]
                      </code>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <Camera className="w-6 h-6 text-electric-cyan" />
                  Technical Parameters
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <p>
                    Include technical details for more control:
                  </p>
                  <div className="bg-deep-bg rounded-lg p-6 space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Resolution and aspect ratio</li>
                      <li>Camera angle and perspective</li>
                      <li>Lighting setup</li>
                      <li>Post-processing effects</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <Palette className="w-6 h-6 text-electric-cyan" />
                  Example Prompts
                </h2>
                <div className="space-y-4">
                  <div className="bg-deep-bg rounded-lg p-6">
                    <h3 className="text-lg font-medium text-soft-lavender mb-3">Portrait Example</h3>
                    <code className="block bg-card-bg p-4 rounded text-soft-lavender/70">
                      A young woman with long flowing red hair, wearing a white silk dress, standing in a meadow at golden hour. Soft bokeh background with wildflowers. Cinematic lighting, shot on Canon EOS R5 with 85mm f/1.2 lens, shallow depth of field, professional color grading, Kodak Portra 400 film simulation
                    </code>
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

export default PromptStructure;