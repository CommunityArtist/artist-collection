import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { NavItem } from '../types';
import { supabase } from '../lib/supabase';

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Prompt Builder', href: '/prompt-builder' },
  { label: 'AI Tools', href: '#' },
  { label: 'Help', href: 'https://eeelffno.genspark.space/' }
];

const aiTools = [
  { label: 'Prompt Extractor', href: 'https://promptextractor.lovable.app/auth' },
  { label: 'VirtuAide', href: 'https://virtuaide-assistant.lovable.app/' }
];

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        buttonRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleExternalLink = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-card-bg shadow-lg py-3' : 'bg-transparent py-4'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="https://images.pexels.com/photos/5011647/pexels-photo-5011647.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Community Artists Logo" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="bg-gradient-to-r from-electric-cyan via-cosmic-purple to-neon-pink bg-clip-text text-transparent inline-block text-3xl font-bold">
                Community Artists
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {navItems.map((item) => (
                <li key={item.label}>
                  {item.label === 'AI Tools' ? (
                    <button
                      ref={buttonRef}
                      className="text-soft-lavender hover:text-electric-cyan transition-colors duration-200"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      {item.label}
                    </button>
                  ) : item.label === 'Help' ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-soft-lavender hover:text-electric-cyan transition-colors duration-200"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link 
                      to={item.href}
                      className="text-soft-lavender hover:text-electric-cyan transition-colors duration-200"
                    >
                      {item.label}
                    </Link>
                  )}
                  {item.label === 'AI Tools' && dropdownOpen && (
                    <div 
                      ref={dropdownRef}
                      className="absolute top-full mt-2 w-48 bg-card-bg rounded-lg shadow-lg border border-border-color py-2"
                    >
                      {aiTools.map((tool) => (
                        <button
                          key={tool.label}
                          onClick={() => handleExternalLink(tool.href)}
                          className="w-full text-left px-4 py-2 text-soft-lavender hover:bg-cosmic-purple/10 transition-colors duration-200"
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            
            <div className="flex items-center gap-4">
              {user ? (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => navigate('/account')}
                >
                  Account
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-soft-lavender"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-card-bg border-t border-border-color">
          <div className="container mx-auto px-4 py-4">
            <ul className="flex flex-col gap-4">
              {navItems.map((item) => (
                <li key={item.label}>
                  {item.label === 'AI Tools' ? (
                    <div className="py-2">
                      <div className="text-soft-lavender font-medium mb-2">AI Tools</div>
                      <div className="pl-4 space-y-2">
                        {aiTools.map((tool) => (
                          <button
                            key={tool.label}
                            onClick={() => {
                              handleExternalLink(tool.href);
                              setIsMenuOpen(false);
                            }}
                            className="w-full text-left text-soft-lavender/70 hover:text-electric-cyan transition-colors duration-200 py-1"
                          >
                            {tool.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : item.label === 'Help' ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-soft-lavender hover:text-electric-cyan transition-colors duration-200 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link 
                      to={item.href}
                      className="block text-soft-lavender hover:text-electric-cyan transition-colors duration-200 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            
            <div className="flex flex-col gap-3 mt-4">
              {user ? (
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    navigate('/account');
                    setIsMenuOpen(false);
                  }}
                >
                  Account
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;