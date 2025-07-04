import React from 'react';
import { ArrowLeft, FolderOpen, Tags, Share2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const LibraryManagement: React.FC = () => {
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
            <h1 className="text-3xl font-bold text-soft-lavender mb-6">Managing Your Library</h1>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-electric-cyan" />
                  Organization
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <p>
                    Keep your prompt library organized and efficient:
                  </p>
                  <div className="bg-deep-bg rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">Creating Collections</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Group similar prompts together</li>
                        <li>Create themed collections</li>
                        <li>Organize by style or purpose</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">Naming Conventions</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Use clear, descriptive names</li>
                        <li>Include key characteristics</li>
                        <li>Add version numbers if iterating</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <Tags className="w-6 h-6 text-electric-cyan" />
                  Tagging System
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <p>
                    Effective tagging makes your prompts easy to find:
                  </p>
                  <div className="bg-deep-bg rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">Tag Categories</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Style tags (realistic, anime, abstract)</li>
                        <li>Subject tags (portrait, landscape, character)</li>
                        <li>Technical tags (lighting, composition)</li>
                        <li>Mood tags (dramatic, peaceful, energetic)</li>
                      </ul>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">Best Practices</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Use consistent tag formatting</li>
                        <li>Avoid too many tags per prompt</li>
                        <li>Keep tags relevant and specific</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <Share2 className="w-6 h-6 text-electric-cyan" />
                  Sharing and Collaboration
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <p>
                    Share your prompts and collaborate with others:
                  </p>
                  <div className="bg-deep-bg rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">Sharing Options</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Public vs. private prompts</li>
                        <li>Sharing with specific users</li>
                        <li>Collaborative collections</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-soft-lavender mb-2">Community Guidelines</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Credit original creators</li>
                        <li>Respect intellectual property</li>
                        <li>Provide constructive feedback</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-soft-lavender mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-electric-cyan" />
                  Maintenance and Backup
                </h2>
                <div className="space-y-4 text-soft-lavender/70">
                  <div className="bg-deep-bg rounded-lg p-6">
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">1</span>
                        <span>Regularly review and update your prompts</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">2</span>
                        <span>Archive unused or outdated prompts</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">3</span>
                        <span>Export important prompts for backup</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">4</span>
                        <span>Keep notes on successful prompt combinations</span>
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

export default LibraryManagement;