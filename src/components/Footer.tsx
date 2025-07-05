import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FooterColumn } from '../types';

const footerColumns: FooterColumn[] = [
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/documentation' },
      { label: 'Prompt Engineering Guide', href: '/prompt-engineering-guide' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Premium Plans', href: '/premium-plans' },
      { label: 'Contact', href: '#' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Cookie Policy', href: '/cookie-policy' }
    ]
  }
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-card-bg border-t border-border-color">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="https://images.pexels.com/photos/5011647/pexels-photo-5011647.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Community Artists Logo" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="bg-gradient-to-r from-electric-cyan via-cosmic-purple to-neon-pink bg-clip-text text-transparent inline-block text-3xl font-bold">
                Community Artists
              </span>
            </div>
            <p className="text-soft-lavender/70 mb-6">
              The ultimate platform for AI art generation, organization, and sharing.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-soft-lavender/70 hover:text-electric-cyan transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-soft-lavender/70 hover:text-electric-cyan transition-colors duration-200">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-soft-lavender/70 hover:text-electric-cyan transition-colors duration-200">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="text-soft-lavender font-medium mb-4">{column.title}</h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link 
                        to={link.href}
                        className="text-soft-lavender/70 hover:text-electric-cyan transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a 
                        href={link.href}
                        className="text-soft-lavender/70 hover:text-electric-cyan transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="pt-8 mt-8 border-t border-border-color text-center text-soft-lavender/50 text-sm">
          © 2025 Community Artists. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;