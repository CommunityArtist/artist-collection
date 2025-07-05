import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

const ApiConfig: React.FC = () => {
  const navigate = useNavigate();
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadApiKey();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setIsAuthenticated(true);
  };

  const loadApiKey = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('api_config')
        .select('key_value')
        .eq('key_name', 'openai_api_key')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.key_value) {
        // Show only the last 4 characters for security
        const maskedKey = '••••••••••••••••••••••••••••••••••••••••••••••••••••' + data.key_value.slice(-4);
        setOpenaiApiKey(maskedKey);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
      setError('Failed to load API configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      if (!openaiApiKey.trim()) {
        throw new Error('Please enter an OpenAI API key');
      }

      if (!openaiApiKey.startsWith('sk-')) {
        throw new Error('OpenAI API key should start with "sk-"');
      }

      // First, try to upsert the API key
      const { error: upsertError } = await supabase
        .from('api_config')
        .upsert({
          key_name: 'openai_api_key',
          key_value: openaiApiKey
        }, {
          onConflict: 'key_name'
        });

      if (upsertError) {
        throw upsertError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reload the masked key
      await loadApiKey();

    } catch (error) {
      console.error('Error saving API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const testApiKey = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API test failed');
      }

      setTestResult('✅ API key is working correctly!');
    } catch (error) {
      console.error('API test error:', error);
      setTestResult(`❌ API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleKeyChange = (value: string) => {
    setOpenaiApiKey(value);
    setError(null);
    setSuccess(false);
    setTestResult(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-deep-bg pt-24">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-card-bg rounded-lg p-8 border border-border-color">
          <div className="flex items-center gap-3 mb-8">
            <Key className="w-6 h-6 text-electric-cyan" />
            <h1 className="text-2xl font-bold text-soft-lavender">API Configuration</h1>
          </div>

          <div className="space-y-6">
            <div className="bg-cosmic-purple/10 border border-cosmic-purple/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-cosmic-purple mt-0.5" />
                <div className="text-sm text-soft-lavender">
                  <p className="font-medium mb-2">Important Security Notice:</p>
                  <ul className="space-y-1 text-soft-lavender/80">
                    <li>• Your API key is stored securely in the database</li>
                    <li>• Only you can view and modify your API configuration</li>
                    <li>• Get your OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-electric-cyan hover:underline">platform.openai.com</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-soft-lavender mb-3 font-medium">
                OpenAI API Key <span className="text-cosmic-purple">*</span>
              </label>
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                className="w-full bg-deep-bg border border-border-color rounded-lg p-4 text-soft-lavender placeholder-soft-lavender/50 focus:outline-none focus:border-cosmic-purple font-mono"
                placeholder="sk-..."
                disabled={isLoading || isSaving}
              />
              <p className="text-soft-lavender/60 text-sm mt-2">
                Enter your OpenAI API key to enable prompt and image generation
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
                  <p className="text-success-green text-sm">API key saved successfully!</p>
                </div>
              </div>
            )}

            {testResult && (
              <div className={`border rounded-lg p-4 ${
                testResult.includes('✅') 
                  ? 'bg-success-green/10 border-success-green/20' 
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <p className={`text-sm ${
                  testResult.includes('✅') ? 'text-success-green' : 'text-red-500'
                }`}>
                  {testResult}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={saveApiKey}
                disabled={isLoading || isSaving || !openaiApiKey.trim()}
                className="flex-1"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? 'Saving...' : 'Save API Key'}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={testApiKey}
                disabled={isLoading || isTesting || !openaiApiKey.trim()}
              >
                {isTesting ? 'Testing...' : 'Test API Key'}
              </Button>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/prompt-builder')}
                className="flex-1"
              >
                Back to Prompt Builder
              </Button>
            </div>

            <div className="bg-deep-bg rounded-lg p-4 border border-border-color">
              <h3 className="text-soft-lavender font-medium mb-3">How to get your OpenAI API Key:</h3>
              <ol className="text-soft-lavender/80 text-sm space-y-2">
                <li>1. Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-electric-cyan hover:underline">platform.openai.com/api-keys</a></li>
                <li>2. Sign in to your OpenAI account</li>
                <li>3. Click "Create new secret key"</li>
                <li>4. Copy the key and paste it above</li>
                <li>5. Make sure your OpenAI account has sufficient credits</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfig;