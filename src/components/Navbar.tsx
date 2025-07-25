import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { NavItem } from '../types';
import { supabase } from '../lib/supabase';

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'AI Tools', href: '#' },
  { label: 'Contact', href: '/contact' },
  { label: 'Help', href: 'https://eeelffno.genspark.space/' }
];

const aiTools = [
  { label: 'Prompt Builder', href: '/prompt-builder' },
  { label: 'Prompt Extractor', href: '/prompt-extractor' },
];

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          setUser(null);
          setUserProfile(null);
          return;
        }
        
        setUser(user);
        
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            console.warn('Profile fetch error:', profileError);
            setUserProfile(null);
          } else {
            setUserProfile(profile);
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setUserProfile(profile);
          })
          .catch((error) => {
            console.warn('Profile fetch error on auth change:', error);
            setUserProfile(null);
          });
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleExternalLink = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const isAdmin = userProfile?.username === 'ADMIN';
  
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
                alt="Community Artist Logo" 
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <span className="bg-gradient-to-r from-electric-cyan via-cosmic-purple to-neon-pink bg-clip-text text-transparent inline-block text-2xl md:text-3xl font-bold whitespace-nowrap">
                Community Artist
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
                      className="absolute top-full mt-2 w-56 bg-card-bg rounded-lg shadow-xl border border-border-color py-2 z-50"
                    >
                      <div className="py-1">
                        <div className="px-4 py-2 text-xs font-medium text-soft-lavender/50 uppercase tracking-wider">
                          AI Tools
                        </div>
                        {aiTools.map((tool) => (
                          <Link
                            key={tool.label}
                            to={tool.href}
                            className="flex items-center px-4 py-3 text-soft-lavender hover:bg-cosmic-purple/10 hover:text-electric-cyan transition-all duration-200"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <span className="text-sm font-medium">{tool.label}</span>
                          </Link>
                        ))}
                      </div>
                      {isAdmin && (
                        <div className="border-t border-border-color">
                          <div className="px-4 py-2 text-xs font-medium text-soft-lavender/50 uppercase tracking-wider">
                            Admin
                          </div>
                          <Link
                            to="/api-access"
                            className="flex items-center px-4 py-3 text-soft-lavender hover:bg-cosmic-purple/10 hover:text-electric-cyan transition-all duration-200"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <span className="text-sm font-medium">API Access</span>
                          </Link>
                        </div>
                      )}
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
                      <div className="pl-4 space-y-1">
                        {aiTools.map((tool) => (
                          <Link
                            key={tool.label}
                            to={tool.href}
                            className="block text-soft-lavender/70 hover:text-electric-cyan transition-colors duration-200 py-2"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {tool.label}
                          </Link>
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