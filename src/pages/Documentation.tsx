import React from 'react';
import { Book, Code, Terminal, Zap, Search, Settings, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const Documentation: React.FC = () => {
  return (
    <div className="min-h-screen bg-deep-bg pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-soft-lavender mb-4">Documentation</h1>
            <p className="text-soft-lavender/70 text-lg">
              Everything you need to know about using Community Artists platform
            </p>
          </div>

          {/* Quick Start Section */}
          <div className="bg-card-bg rounded-lg p-8 border border-border-color mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-electric-cyan" />
              <h2 className="text-2xl font-bold text-soft-lavender">Quick Start</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-deep-bg rounded-lg p-6">
                <h3 className="text-xl font-semibold text-soft-lavender mb-4">Getting Started</h3>
                <ol className="space-y-4 text-soft-lavender/70">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">1</span>
                    <span>Create an account or sign in to get started</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">2</span>
                    <span>Browse the prompt library or create your first prompt</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">3</span>
                    <span>Customize and save prompts to your library</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Main Documentation Sections */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center gap-3 mb-4">
                <Book className="w-5 h-5 text-electric-cyan" />
                <h3 className="text-xl font-semibold text-soft-lavender">Guides</h3>
              </div>
              <ul className="space-y-3 text-soft-lavender/70">
                <li>
                  <Link 
                    to="/documentation/prompt-structure"
                    className="hover:text-electric-cyan transition-colors"
                  >
                    • Understanding Prompt Structure
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/documentation/best-practices"
                    className="hover:text-electric-cyan transition-colors"
                  >
                    • Best Practices for AI Art
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/documentation/library-management"
                    className="hover:text-electric-cyan transition-colors"
                  >
                    • Managing Your Library
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center gap-3 mb-4">
                <Code className="w-5 h-5 text-electric-cyan" />
                <h3 className="text-xl font-semibold text-soft-lavender">API Reference</h3>
              </div>
              <ul className="space-y-3 text-soft-lavender/70">
                <li>
                  <a href="#" className="hover:text-electric-cyan transition-colors">
                    • Authentication
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-electric-cyan transition-colors">
                    • Endpoints
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-electric-cyan transition-colors">
                    • Rate Limits
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Features Documentation */}
          <div className="space-y-8">
            <div className="bg-card-bg rounded-lg p-8 border border-border-color">
              <div className="flex items-center gap-3 mb-6">
                <Search className="w-6 h-6 text-electric-cyan" />
                <h2 className="text-2xl font-bold text-soft-lavender">Search & Discovery</h2>
              </div>
              <div className="space-y-4 text-soft-lavender/70">
                <p>
                  Learn how to effectively search and filter prompts to find exactly what you need.
                  Our advanced search features allow you to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Search by keywords and phrases</li>
                  <li>Filter by categories and tags</li>
                  
                  <li>Sort by popularity and date</li>
                  <li>Save favorite prompts</li>
                </ul>
                <Button variant="outline" size="sm" className="mt-4">
                  Learn More About Search
                </Button>
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-8 border border-border-color">
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="w-6 h-6 text-electric-cyan" />
                <h2 className="text-2xl font-bold text-soft-lavender">Prompt Engineering</h2>
              </div>
              <div className="space-y-4 text-soft-lavender/70">
                <p>
                  Master the art of creating effective prompts with our comprehensive guide to prompt engineering.
                  Learn about:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Basic prompt structure and formatting</li>
                  <li>Advanced techniques and modifiers</li>
                  <li>Style mixing and combinations</li>
                  <li>Troubleshooting common issues</li>
                </ul>
                <Button variant="outline" size="sm" className="mt-4">
                  Explore Prompt Engineering
                </Button>
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-8 border border-border-color">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-electric-cyan" />
                <h2 className="text-2xl font-bold text-soft-lavender">Account Management</h2>
              </div>
              <div className="space-y-4 text-soft-lavender/70">
                <p>
                  Learn how to manage your account settings, preferences, and security options:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Profile customization</li>
                  <li>Privacy settings</li>
                  <li>API key management</li>
                  <li>Subscription options</li>
                </ul>
                <Button variant="outline" size="sm" className="mt-4">
                  View Account Guide
                </Button>
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-8 border border-border-color">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-electric-cyan" />
                <h2 className="text-2xl font-bold text-soft-lavender">Security</h2>
              </div>
              <div className="space-y-4 text-soft-lavender/70">
                <p>
                  Understand our security features and best practices for keeping your account safe:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Two-factor authentication</li>
                  <li>API key security</li>
                  <li>Data encryption</li>
                  <li>Privacy controls</li>
                </ul>
                <Button variant="outline" size="sm" className="mt-4">
                  Read Security Guide
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;