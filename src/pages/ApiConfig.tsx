import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Save, AlertCircle, CheckCircle, Shield, Users, Zap } from 'lucide-react';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

const ApiConfig: React.FC = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [globalApiKey, setGlobalApiKey] = useState('');
  const [userApiAccess, setUserApiAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
    loadApiData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Fetch user profile to check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    
    setUserProfile(profile);
    
    // Check if user is admin
    const adminStatus = profile?.username === 'ADMIN';
    setIsAdmin(adminStatus);
    
    setIsAuthenticated(true);
  };

  const loadApiData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check user's API access status
      const { data: accessData, error: accessError } = await supabase
        .from('api_access')
        .select('has_access')
        .eq('user_email', user.email)
        .single();

      if (!accessError && accessData) {
        setUserApiAccess(accessData.has_access);
      }

      // If admin, load global API key
      if (isAdmin) {
        const { data: keyData, error: keyError } = await supabase
          .from('api_config')
          .select('key_value')
          .eq('key_name', 'openai_api_key')
          .is('user_id', null)
          .single();

        if (!keyError && keyData?.key_value) {
          // Show only the last 4 characters for security
          const maskedKey = '••••••••••••••••••••••••••••••••••••••••••••••••••••' + keyData.key_value.slice(-4);
          setGlobalApiKey(maskedKey);
        }
      }
    } catch (error) {
      console.error('Error loading API data:', error);
      setError('Failed to load API information');
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!globalApiKey.trim()) {
        throw new Error('Please enter an OpenAI API key');
      }

      if (!globalApiKey.startsWith('sk-')) {
        throw new Error('OpenAI API key should start with "sk-"');
      }

      // Update the global API key (admin only)
      const { error: upsertError } = await supabase
        .from('api_config')
        .upsert({
          key_name: 'openai_api_key',
          key_value: globalApiKey,
          user_id: null
        }, {
          onConflict: 'user_id,key_name'
        });

      if (upsertError) {
        throw upsertError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reload the masked key
      await loadApiData();

    } catch (error) {
      console.error('Error saving API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyChange = (value: string) => {
    setGlobalApiKey(value);
    setError(null);
    setSuccess(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-deep-bg pt-24">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Key className="w-6 h-6 text-electric-cyan" />
            <h1 className="text-2xl font-bold text-soft-lavender">
              {isAdmin ? 'API Configuration (Admin)' : 'API Access Status'}
            </h1>
          </div>

          {/* User API Access Status */}
          <div className="bg-card-bg rounded-lg p-6 border border-border-color">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-electric-cyan" />
              <h2 className="text-xl font-semibold text-soft-lavender">Your API Access Status</h2>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              userApiAccess 
                ? 'bg-success-green/10 border-success-green/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-center gap-3">
                {userApiAccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-success-green" />
                    <div>
                      <p className="text-success-green font-medium">✅ API Access Granted</p>
                      <p className="text-success-green/80 text-sm">You can generate images and use AI features</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-red-500 font-medium">❌ API Access Denied</p>
                      <p className="text-red-500/80 text-sm">Contact support to enable image generation</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="bg-card-bg rounded-lg p-8 border border-border-color">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-neon-pink" />
                <h2 className="text-xl font-semibold text-soft-lavender">Global API Key Management</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-cosmic-purple/10 border border-cosmic-purple/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-cosmic-purple mt-0.5" />
                    <div className="text-sm text-soft-lavender">
                      <p className="font-medium mb-2">Admin Notice:</p>
                      <ul className="space-y-1 text-soft-lavender/80">
                        <li>• This global API key is used by all Edge Functions</li>
                        <li>• Changes affect all users immediately</li>
                        <li>• Key should also be set in Supabase Edge Functions environment variables</li>
                        <li>• Get your OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-electric-cyan hover:underline">platform.openai.com</a></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-soft-lavender mb-3 font-medium">
                    Global OpenAI API Key <span className="text-cosmic-purple">*</span>
                  </label>
                  <input
                    type="password"
                    value={globalApiKey}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    className="w-full bg-deep-bg border border-border-color rounded-lg p-4 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple font-mono"
                    placeholder="sk-..."
                    disabled={isLoading || isSaving}
                  />
                  <p className="text-soft-lavender/60 text-sm mt-2">
                    This key is used globally for all users' image generation
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-red-500 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-success-green/10 border border-success-green/20 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success-green" />
                      <p className="text-success-green text-sm">Global API key updated successfully!</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={saveApiKey}
                    disabled={isLoading || isSaving || !globalApiKey.trim()}
                    className="flex-1"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Global API Key'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Section */}
          <div className="bg-card-bg rounded-lg p-6 border border-border-color">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-electric-cyan" />
              <h2 className="text-xl font-semibold text-soft-lavender">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/prompt-builder')}
                className="flex-1"
              >
                Try Prompt Builder
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/prompt-extractor')}
                className="flex-1"
              >
                Try Prompt Extractor
              </Button>
              
              {isAdmin && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/api-access')}
                  className="md:col-span-2"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Manage User API Access
                </Button>
              )}
            </div>
          </div>

          {/* System Information */}
          <div className="bg-deep-bg rounded-lg p-6 border border-border-color">
            <h3 className="text-soft-lavender font-medium mb-3">System Information</h3>
            <div className="space-y-2 text-sm text-soft-lavender/70">
              <p>• <strong>API Access:</strong> {userApiAccess ? 'Enabled' : 'Disabled'}</p>
              <p>• <strong>User Type:</strong> {isAdmin ? 'Administrator' : 'Standard User'}</p>
              <p>• <strong>Authentication:</strong> Active</p>
              <p>• <strong>Email:</strong> {userProfile?.id ? 'Verified' : 'Pending'}</p>
            </div>
              </div>
            )}

            {testResult && (
              <div className={`border rounded-lg p-4 ${
                testResult.includes('✅') 
                  ? 'bg-success-green/10 border-success-green/20' 
                  : 'bg-red-500/10 border-red-500/20'
export default ApiConfig;